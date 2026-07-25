// Server-side validation for the contact form (FR-003, NFR-003, AC-003).
//
// Deliberately independent of any client-side validation: this module is
// the sole gate the Route Handler relies on, so a malicious or buggy client
// that skips its own checks still gets rejected here.

import type { ContactPayload, ValidationError, ValidationResult } from "./types";

// A pragmatic "is this shaped like an email" check, not full RFC 5322 —
// judgment call for a low-stakes contact form (see PR notes). Deliberately
// rejects obviously-malformed input (missing @, missing domain, whitespace)
// without trying to be a fully compliant email grammar validator.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_MAX_LENGTH = 200;
const EMAIL_MAX_LENGTH = 320; // RFC 5321 practical upper bound
const MESSAGE_MAX_LENGTH = 5000;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates and normalizes a raw, untrusted payload. Returns either the
 * normalized submission (trimmed fields + honeypot flag) or a list of
 * field-level errors — never throws.
 */
export function validateContactPayload(raw: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {
      ok: false,
      errors: [{ field: "body", message: "Request body must be a JSON object." }],
    };
  }

  const payload = raw as Partial<ContactPayload>;

  if (!isNonEmptyString(payload.name)) {
    errors.push({ field: "name", message: "Name is required." });
  } else if (payload.name.trim().length > NAME_MAX_LENGTH) {
    errors.push({ field: "name", message: `Name must be ${NAME_MAX_LENGTH} characters or fewer.` });
  }

  if (!isNonEmptyString(payload.email)) {
    errors.push({ field: "email", message: "Email is required." });
  } else {
    const trimmedEmail = payload.email.trim();
    if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
      errors.push({ field: "email", message: `Email must be ${EMAIL_MAX_LENGTH} characters or fewer.` });
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.push({ field: "email", message: "Email must be a valid email address." });
    }
  }

  if (!isNonEmptyString(payload.message)) {
    errors.push({ field: "message", message: "Message is required." });
  } else if (payload.message.trim().length > MESSAGE_MAX_LENGTH) {
    errors.push({ field: "message", message: `Message must be ${MESSAGE_MAX_LENGTH} characters or fewer.` });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // At this point name/email/message are guaranteed present and valid.
  const name = (payload.name as string).trim();
  const email = (payload.email as string).trim();
  const message = (payload.message as string).trim();

  // Honeypot: a real visitor never sees or fills this hidden field (it's
  // CSS-hidden client-side, per the locked "no visible CAPTCHA" decision —
  // OQ-003/ADR-001 D4). Any non-empty value here is a bot signal.
  const honeypotFilled = isNonEmptyString(payload.website);

  return { ok: true, value: { name, email, message, honeypotFilled } };
}
