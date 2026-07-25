/**
 * Contact-action constants (T-016, FR-002/FR-004). Two of these are launch
 * placeholders, flagged explicitly so they aren't mistaken for final values:
 *
 * - `CALENDLY_URL`: no real Calendly link has been provided yet. Overridable
 *   via `NEXT_PUBLIC_CALENDLY_URL` (see apps/web/.env.example) so it can be
 *   swapped without a code change once Gaurav confirms one.
 * - Resume file: `RESUME_FILE_PATH` points at a placeholder PDF
 *   (`apps/web/public/resume-placeholder.pdf`), not Gaurav's real resume —
 *   see OQ-005 in docs/10-product/OPEN_QUESTIONS.md ("Blocked on real resume
 *   PDF asset before launch, not before build" per TASKS.jsonl T-016).
 */

export const CONTACT_EMAIL = "gauravchaulagain0@gmail.com";

export const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ??
  "https://calendly.com/gauravchaulagain/intro-call";

export const RESUME_FILE_PATH = "/resume-placeholder.pdf";
export const RESUME_DOWNLOAD_FILENAME = "Gaurav-Chaulagain-Resume.pdf";
