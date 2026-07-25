// Fast, in-memory unit tests for the orchestration logic in handler.ts.
// Uses hand-written fakes (not the real Supabase/Resend clients) to isolate
// branch coverage of handler.ts itself. Real-database and real-query-shape
// coverage lives in contact.integration.test.ts (local Postgres) instead.

import { describe, expect, it, vi } from "vitest";
import { handleContactSubmission, DEFAULT_DUPLICATE_WINDOW_MS } from "../handler";
import type { ContactSubmissionsRepo, EmailSender, OpResult } from "../types";

// Small typed helpers so mock return values keep the `OpResult` discriminated
// union's literal `ok` field instead of widening to `boolean` under
// contextual typing (which `satisfies` alone doesn't prevent inside `vi.fn`).
function ok<T>(value: T): OpResult<T> {
  return { ok: true, value };
}
function err<T>(error: Error): OpResult<T> {
  return { ok: false, error };
}

function okRepo(overrides: Partial<ContactSubmissionsRepo> = {}): ContactSubmissionsRepo {
  return {
    hasRecentDuplicate: vi.fn(async () => ok(false)),
    insertPending: vi.fn(async () => ok({ id: "submission-1" })),
    markDelivered: vi.fn(async () => ok(undefined)),
    markFailed: vi.fn(async () => ok(undefined)),
    ...overrides,
  };
}

function okEmailSender(overrides: Partial<EmailSender> = {}): EmailSender {
  return {
    sendContactNotification: vi.fn(async () => ok(undefined)),
    ...overrides,
  };
}

const validPayload = { name: "Ada Lovelace", email: "ada@example.com", message: "Hello Gaurav!" };

describe("handleContactSubmission", () => {
  it("AC-004: a valid submission is persisted, delivered, and marked 'delivered'", async () => {
    const repo = okRepo();
    const emailSender = okEmailSender();

    const result = await handleContactSubmission(validPayload, { repo, emailSender });

    expect(result).toEqual({ status: 200, body: { ok: true, id: "submission-1" } });
    expect(repo.insertPending).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "Hello Gaurav!",
      submissionHash: expect.any(String),
    });
    expect(emailSender.sendContactNotification).toHaveBeenCalledWith(
      expect.objectContaining({ submissionId: "submission-1" }),
    );
    expect(repo.markDelivered).toHaveBeenCalledWith("submission-1");
    expect(repo.markFailed).not.toHaveBeenCalled();
  });

  it("AC-003: invalid input is rejected before touching the repo or email sender, independent of any client-side check", async () => {
    const repo = okRepo();
    const emailSender = okEmailSender();

    const result = await handleContactSubmission(
      { name: "", email: "not-an-email", message: "" },
      { repo, emailSender },
    );

    expect(result.status).toBe(400);
    expect(result.body.ok).toBe(false);
    if (result.status === 400) {
      expect(result.body.fields.map((f) => f.field).sort()).toEqual(["email", "message", "name"]);
    }
    expect(repo.hasRecentDuplicate).not.toHaveBeenCalled();
    expect(repo.insertPending).not.toHaveBeenCalled();
    expect(emailSender.sendContactNotification).not.toHaveBeenCalled();
  });

  it("honeypot: a filled hidden field is silently rejected — no persistence, no email, success-shaped response", async () => {
    const repo = okRepo();
    const emailSender = okEmailSender();

    const result = await handleContactSubmission(
      { ...validPayload, website: "https://spammer.example" },
      { repo, emailSender },
    );

    expect(result.status).toBe(200);
    expect(repo.insertPending).not.toHaveBeenCalled();
    expect(emailSender.sendContactNotification).not.toHaveBeenCalled();
  });

  it("AC-006: a duplicate hash within the trailing window is rejected with 429, without inserting a second row", async () => {
    const repo = okRepo({ hasRecentDuplicate: vi.fn(async () => ok(true)) });
    const emailSender = okEmailSender();

    const result = await handleContactSubmission(validPayload, { repo, emailSender });

    expect(result).toEqual({ status: 429, body: { ok: false, error: "duplicate_submission" } });
    expect(repo.insertPending).not.toHaveBeenCalled();
  });

  it("passes a duplicate-check window derived from `now` and duplicateWindowMs", async () => {
    const repo = okRepo();
    const emailSender = okEmailSender();
    const now = new Date("2026-07-24T12:10:00.000Z");

    await handleContactSubmission(validPayload, {
      repo,
      emailSender,
      now: () => now,
      duplicateWindowMs: 60_000,
    });

    expect(repo.hasRecentDuplicate).toHaveBeenCalledWith(
      expect.any(String),
      new Date(now.getTime() - 60_000),
    );
  });

  it("uses a 5-minute default duplicate window when none is provided", () => {
    expect(DEFAULT_DUPLICATE_WINDOW_MS).toBe(5 * 60 * 1000);
  });

  it("fails closed with 503 when the duplicate-check query itself errors (Supabase unreachable)", async () => {
    const repo = okRepo({
      hasRecentDuplicate: vi.fn(async () => err<boolean>(new Error("connection refused"))),
    });
    const emailSender = okEmailSender();

    const result = await handleContactSubmission(validPayload, { repo, emailSender });

    expect(result).toEqual({ status: 503, body: { ok: false, error: "storage_unavailable" } });
    expect(repo.insertPending).not.toHaveBeenCalled();
  });

  it("fails closed with 503 when the durable insert fails, and never attempts delivery", async () => {
    const repo = okRepo({
      insertPending: vi.fn(async () => err<{ id: string }>(new Error("insert failed"))),
    });
    const emailSender = okEmailSender();

    const result = await handleContactSubmission(validPayload, { repo, emailSender });

    expect(result).toEqual({ status: 503, body: { ok: false, error: "storage_unavailable" } });
    expect(emailSender.sendContactNotification).not.toHaveBeenCalled();
  });

  it("AC-005/NFR-005: a Resend failure marks the row 'failed' and returns an explicit 502 error (never silent)", async () => {
    const repo = okRepo();
    const emailSender = okEmailSender({
      sendContactNotification: vi.fn(async () => err<void>(new Error("Resend API error"))),
    });

    const result = await handleContactSubmission(validPayload, { repo, emailSender });

    expect(result).toEqual({ status: 502, body: { ok: false, error: "delivery_failed", id: "submission-1" } });
    expect(repo.markFailed).toHaveBeenCalledWith("submission-1");
    expect(repo.markDelivered).not.toHaveBeenCalled();
  });

  it("still reports the delivery failure to the caller even if markFailed itself errors", async () => {
    const repo = okRepo({
      markFailed: vi.fn(async () => err<void>(new Error("db write failed"))),
    });
    const emailSender = okEmailSender({
      sendContactNotification: vi.fn(async () => err<void>(new Error("Resend API error"))),
    });

    const result = await handleContactSubmission(validPayload, { repo, emailSender });

    expect(result.status).toBe(502);
  });

  it("still reports success to the visitor if the email sent but markDelivered fails (message did arrive)", async () => {
    const repo = okRepo({
      markDelivered: vi.fn(async () => err<void>(new Error("db write failed"))),
    });
    const emailSender = okEmailSender();
    const logger = vi.fn();

    const result = await handleContactSubmission(validPayload, { repo, emailSender, logger });

    expect(result.status).toBe(200);
    expect(logger).toHaveBeenCalledWith("contact.mark_delivered.error", expect.anything());
  });
});
