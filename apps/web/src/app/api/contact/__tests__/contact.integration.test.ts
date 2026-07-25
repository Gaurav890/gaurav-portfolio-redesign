// Integration tests for POST /api/contact's orchestration logic
// (handler.ts), run against:
//   - a real, throwaway local Postgres instance running the actual
//     contact_submissions migration (local-postgres.ts / pg-contact-repo.ts)
//   - a mocked/stubbed EmailSender standing in for Resend
//
// Verified locally, not yet against live services (.claude/rules/testing.md):
// this exercises real SQL/constraint semantics (the duplicate-window WHERE
// clause, the delivery_status CHECK constraint, real INSERT/UPDATE
// round-trips) but NOT the real Supabase HTTP/PostgREST transport or a real
// Resend account — neither is available in this environment. See
// __tests__/README.md.
//
// Covers this task's required verification set:
//   - valid submission delivers and marks 'delivered' (AC-004)
//   - invalid input rejected server-side, independent of any client check (AC-003)
//   - duplicate submission rejected (AC-006)
//   - simulated Resend failure surfaces an explicit error and marks 'failed' (AC-005/NFR-005)

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import { handleContactSubmission } from "../handler";
import { computeSubmissionHash } from "../hash";
import type { EmailSender, OpResult } from "../types";
import { isLocalPostgresAvailable, startLocalPostgres, type LocalPostgres } from "./local-postgres";
import { createPgContactRepo } from "./pg-contact-repo";

const pgAvailable = isLocalPostgresAvailable();
if (!pgAvailable) {
  // Not a silent pass: make it obvious in test output why this suite didn't run.
  console.warn(
    "[contact.integration.test] Skipping: no local `initdb`/`pg_ctl` found on PATH. " +
      "Set PG_INITDB_BIN/PG_PG_CTL_BIN or install PostgreSQL to run this suite.",
  );
}

function okEmailSender(): EmailSender {
  return { sendContactNotification: vi.fn(async () => ({ ok: true, value: undefined }) satisfies OpResult<void>) };
}

function failingEmailSender(message: string): EmailSender {
  return {
    sendContactNotification: vi.fn(async () => ({ ok: false, error: new Error(message) }) satisfies OpResult<void>),
  };
}

async function fetchRow(pool: Pool, id: string) {
  const result = await pool.query("select id, delivery_status, submission_hash from contact_submissions where id = $1", [
    id,
  ]);
  return result.rows[0] as { id: string; delivery_status: string; submission_hash: string } | undefined;
}

describe.skipIf(!pgAvailable)("POST /api/contact against a local Postgres instance", () => {
  let db: LocalPostgres;

  beforeAll(async () => {
    db = await startLocalPostgres();
  }, 30_000);

  afterAll(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.pool.query("truncate table contact_submissions");
  });

  it("AC-004: a valid submission is durably inserted, delivered via the email sender, and marked 'delivered'", async () => {
    const repo = createPgContactRepo(db.pool);
    const emailSender = okEmailSender();

    const result = await handleContactSubmission(
      { name: "Ada Lovelace", email: "ada@example.com", message: "Excited to connect!" },
      { repo, emailSender },
    );

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    if (!result.body.ok) throw new Error("unreachable");

    expect(emailSender.sendContactNotification).toHaveBeenCalledTimes(1);

    const row = await fetchRow(db.pool, result.body.id);
    expect(row?.delivery_status).toBe("delivered");
  });

  it("AC-003: invalid input (bad email format) is rejected server-side and never reaches the database", async () => {
    const repo = createPgContactRepo(db.pool);
    const emailSender = okEmailSender();

    const result = await handleContactSubmission(
      // Simulates a malicious/buggy client that skipped its own validation.
      { name: "Ada Lovelace", email: "not-an-email", message: "Excited to connect!" },
      { repo, emailSender },
    );

    expect(result.status).toBe(400);
    expect(emailSender.sendContactNotification).not.toHaveBeenCalled();

    const count = await db.pool.query("select count(*)::int as count from contact_submissions");
    expect(count.rows[0].count).toBe(0);
  });

  it("AC-006: submitting the same email+message twice within the window is rejected on the second attempt", async () => {
    const repo = createPgContactRepo(db.pool);
    const emailSender = okEmailSender();
    const payload = { name: "Ada Lovelace", email: "ada@example.com", message: "Same message twice" };

    const first = await handleContactSubmission(payload, { repo, emailSender });
    expect(first.status).toBe(200);

    const second = await handleContactSubmission(payload, { repo, emailSender });
    expect(second).toEqual({ status: 429, body: { ok: false, error: "duplicate_submission" } });

    const hash = computeSubmissionHash(payload.email, payload.message);
    const count = await db.pool.query("select count(*)::int as count from contact_submissions where submission_hash = $1", [
      hash,
    ]);
    expect(count.rows[0].count).toBe(1);
  });

  it("AC-006 boundary: the same email+message is accepted again once it falls outside the duplicate window", async () => {
    const repo = createPgContactRepo(db.pool);
    const emailSender = okEmailSender();
    const payload = { name: "Ada Lovelace", email: "ada@example.com", message: "Outside the window" };
    const hash = computeSubmissionHash(payload.email, payload.message);

    // Insert a row directly with a created_at 10 minutes in the past —
    // outside the 5-minute default duplicate window — to test the real SQL
    // WHERE clause's time-boundary behavior, not just the application code.
    await db.pool.query(
      `insert into contact_submissions (name, email, message, submission_hash, delivery_status, created_at)
       values ($1, $2, $3, $4, 'delivered', now() - interval '10 minutes')`,
      [payload.name, payload.email, payload.message, hash],
    );

    const result = await handleContactSubmission(payload, { repo, emailSender });

    expect(result.status).toBe(200);
  });

  it("AC-005/NFR-005: a simulated Resend failure surfaces an explicit 502 error and marks the row 'failed'", async () => {
    const repo = createPgContactRepo(db.pool);
    const emailSender = failingEmailSender("simulated Resend outage");

    const result = await handleContactSubmission(
      { name: "Ada Lovelace", email: "ada@example.com", message: "Please reach out" },
      { repo, emailSender },
    );

    expect(result.status).toBe(502);
    if (result.status !== 502) throw new Error("unreachable");
    expect(result.body.ok).toBe(false);
    expect(result.body.error).toBe("delivery_failed");

    const row = await fetchRow(db.pool, result.body.id);
    // Durably recorded before the delivery attempt, and now reflects the
    // failure explicitly — never silently dropped.
    expect(row).toBeDefined();
    expect(row?.delivery_status).toBe("failed");
  });

  it("the delivery_status CHECK constraint rejects an invalid status value directly at the DB layer", async () => {
    await expect(
      db.pool.query(
        `insert into contact_submissions (name, email, message, submission_hash, delivery_status)
         values ('x', 'x@example.com', 'x', 'deadbeef', 'not_a_real_status')`,
      ),
    ).rejects.toThrow(/violates check constraint/);
  });
});
