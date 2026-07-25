// Submission-hash computation for the AC-006 duplicate-window check.
//
// Must match the normalization rule documented in the migration
// (`packages/database/supabase/migrations/20260724120000_contact_submissions.sql`)
// exactly: sha256(lower(trim(email)) || '|' || trim(message)). The app owns
// this rule (not a generated DB column) so it can evolve independently of
// the schema — see that migration's comment on `submission_hash`.

import { createHash } from "node:crypto";

export function computeSubmissionHash(email: string, message: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedMessage = message.trim();
  return createHash("sha256").update(`${normalizedEmail}|${normalizedMessage}`).digest("hex");
}
