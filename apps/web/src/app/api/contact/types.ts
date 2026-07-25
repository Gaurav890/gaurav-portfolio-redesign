// Shared types for the /api/contact Route Handler (FR-003, T-020).
//
// The handler in `handler.ts` is framework-agnostic (no Next.js types) and
// depends only on the interfaces below, so it can be exercised directly in
// tests without a running Next.js server, and so the Supabase/Resend
// integrations can be swapped for test doubles without changing the
// orchestration logic. See ARCHITECTURE.md's "Contact-form submission" flow.

/** Raw shape submitted by the client. `website` is the honeypot field. */
export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  website?: string;
}

export interface ValidationError {
  field: "name" | "email" | "message" | "body";
  message: string;
}

export interface ParsedContactSubmission {
  name: string;
  email: string;
  message: string;
  /** True when the hidden honeypot field was filled in — bot signal. */
  honeypotFilled: boolean;
}

export type ValidationResult =
  | { ok: true; value: ParsedContactSubmission }
  | { ok: false; errors: ValidationError[] };

/** Uniform result wrapper for repo/email-sender operations that can fail. */
export type OpResult<T> = { ok: true; value: T } | { ok: false; error: Error };

/**
 * Data-access boundary for `contact_submissions`. The production
 * implementation (`supabase-repo.ts`) uses the real `@supabase/supabase-js`
 * client. Tests substitute a Postgres-backed implementation
 * (`__tests__/pg-contact-repo.ts`) that exercises the same SQL semantics
 * against a local, throwaway Postgres instance running the real migration —
 * see `__tests__/README.md` for the local-vs-live verification distinction.
 */
export interface ContactSubmissionsRepo {
  /** Does a row with this hash exist with created_at >= windowStart? */
  hasRecentDuplicate(hash: string, windowStart: Date): Promise<OpResult<boolean>>;
  /** Insert a new row with delivery_status = 'pending'. Must happen before
   *  any delivery attempt (durability-first ordering, ARCHITECTURE.md). */
  insertPending(input: {
    name: string;
    email: string;
    message: string;
    submissionHash: string;
  }): Promise<OpResult<{ id: string }>>;
  markDelivered(id: string): Promise<OpResult<void>>;
  markFailed(id: string): Promise<OpResult<void>>;
}

/** Outbound notification-email boundary. Production impl wraps the real
 *  Resend SDK; tests substitute a stub/mock (never a live Resend account). */
export interface EmailSender {
  sendContactNotification(input: {
    name: string;
    email: string;
    message: string;
    submissionId: string;
  }): Promise<OpResult<void>>;
}

export type ContactHandlerResult =
  | { status: 200; body: { ok: true; id: string } }
  | { status: 400; body: { ok: false; error: "invalid_input"; fields: ValidationError[] } }
  | { status: 429; body: { ok: false; error: "duplicate_submission" } }
  | { status: 503; body: { ok: false; error: "storage_unavailable" } }
  | { status: 502; body: { ok: false; error: "delivery_failed"; id: string } };
