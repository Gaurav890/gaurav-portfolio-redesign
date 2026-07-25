// Core orchestration logic for POST /api/contact (FR-003), independent of
// Next.js request/response types so it can be exercised directly in tests.
// Implements ARCHITECTURE.md's "Contact-form submission" flow step by step:
//
//   1. Server-side validation (independent of client validation) — AC-003.
//   2. Honeypot check — silently reject (no persistence, no email) if filled.
//   3. Duplicate check against Supabase (hash of email+message within a
//      short trailing window) — AC-006.
//   4. Insert a row with delivery_status = 'pending' BEFORE attempting
//      delivery — durability-first, nothing is ever silently lost.
//   5. Call the email sender (Resend in production).
//   6. On success: mark 'delivered', return success — AC-004.
//   7. On failure: mark 'failed', return an explicit error — NFR-005/AC-005.

import { computeSubmissionHash } from "./hash";
import { validateContactPayload } from "./validation";
import type { ContactHandlerResult, ContactSubmissionsRepo, EmailSender } from "./types";

// Judgment call (T-020): the migration's comment suggests "a few minutes";
// 5 minutes balances blocking rapid re-submits/double-clicks against not
// blocking a visitor who legitimately sends two different messages close
// together in time (the hash also includes the message content, so this
// only fires on an exact repeat of the same email+message pair).
export const DEFAULT_DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

export interface ContactHandlerDeps {
  repo: ContactSubmissionsRepo;
  emailSender: EmailSender;
  /** Injectable clock for deterministic duplicate-window tests. */
  now?: () => Date;
  duplicateWindowMs?: number;
  logger?: (event: string, meta: Record<string, unknown>) => void;
}

export async function handleContactSubmission(
  rawPayload: unknown,
  deps: ContactHandlerDeps,
): Promise<ContactHandlerResult> {
  const log = deps.logger ?? (() => {});

  // Step 1: server-side validation, independent of any client-side checks.
  const parsed = validateContactPayload(rawPayload);
  if (!parsed.ok) {
    log("contact.rejected.invalid_input", { fieldCount: parsed.errors.length });
    return { status: 400, body: { ok: false, error: "invalid_input", fields: parsed.errors } };
  }

  const { name, email, message, honeypotFilled } = parsed.value;

  // Step 2: honeypot. A real visitor can never fill this hidden field, so a
  // filled value is treated as a bot and silently rejected — no DB write, no
  // email, and a response indistinguishable from success, so an automated
  // client has no signal to adapt against (matches the locked "no visible
  // CAPTCHA" decision, OQ-003/ADR-001 D4).
  if (honeypotFilled) {
    log("contact.rejected.honeypot", {});
    return { status: 200, body: { ok: true, id: "ignored" } };
  }

  // Step 3: duplicate check (AC-006).
  const submissionHash = computeSubmissionHash(email, message);
  const now = deps.now ? deps.now() : new Date();
  const windowMs = deps.duplicateWindowMs ?? DEFAULT_DUPLICATE_WINDOW_MS;
  const windowStart = new Date(now.getTime() - windowMs);

  const duplicateCheck = await deps.repo.hasRecentDuplicate(submissionHash, windowStart);
  if (!duplicateCheck.ok) {
    // Supabase unreachable/erroring: fail closed with an explicit error
    // rather than silently skipping the abuse check (ARCHITECTURE.md
    // "Failure modes": Supabase unreachable -> fail closed, never a silent
    // 200 that drops data).
    log("contact.rejected.storage_unavailable", {
      stage: "duplicate_check",
      error: duplicateCheck.error.message,
    });
    return { status: 503, body: { ok: false, error: "storage_unavailable" } };
  }
  if (duplicateCheck.value) {
    log("contact.rejected.duplicate", {});
    return { status: 429, body: { ok: false, error: "duplicate_submission" } };
  }

  // Step 4: durable write BEFORE any delivery attempt.
  const insertResult = await deps.repo.insertPending({ name, email, message, submissionHash });
  if (!insertResult.ok) {
    log("contact.rejected.storage_unavailable", { stage: "insert", error: insertResult.error.message });
    return { status: 503, body: { ok: false, error: "storage_unavailable" } };
  }
  const { id } = insertResult.value;
  log("contact.persisted.pending", { id });

  // Step 5: attempt delivery.
  const sendResult = await deps.emailSender.sendContactNotification({
    name,
    email,
    message,
    submissionId: id,
  });

  if (!sendResult.ok) {
    // Step 7: mark 'failed' and surface an explicit error. The submission
    // is never lost silently — it's already durably recorded above.
    log("contact.delivery.failed", { id, error: sendResult.error.message });
    const markFailedResult = await deps.repo.markFailed(id);
    if (!markFailedResult.ok) {
      // The row stays 'pending' rather than 'failed' — still durably
      // recorded, just not yet reflecting the true status. Logged loudly
      // for operational follow-up since this is now a manual-recovery case.
      log("contact.mark_failed.error", { id, error: markFailedResult.error.message });
    }
    return { status: 502, body: { ok: false, error: "delivery_failed", id } };
  }

  // Step 6: mark 'delivered' and return success.
  const markDeliveredResult = await deps.repo.markDelivered(id);
  if (!markDeliveredResult.ok) {
    // The email genuinely sent — report success to the visitor (their
    // message did arrive) but log loudly, since the row's status now
    // under-reports reality (stuck at 'pending' instead of 'delivered').
    log("contact.mark_delivered.error", { id, error: markDeliveredResult.error.message });
  }

  log("contact.delivered", { id });
  return { status: 200, body: { ok: true, id } };
}
