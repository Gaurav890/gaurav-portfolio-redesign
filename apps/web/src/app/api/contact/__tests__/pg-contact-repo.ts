// Test-only ContactSubmissionsRepo implementation, backed by raw SQL against
// the local Postgres instance started by local-postgres.ts. Deliberately
// mirrors the exact query shapes in supabase-repo.ts (same WHERE/ORDER
// semantics for the duplicate-window check, same insert/update columns) so
// integration tests exercise the real query logic and the real CHECK
// constraint on delivery_status, against the actual migration schema — not
// the Supabase HTTP/PostgREST transport layer, which this environment has
// no way to stand up locally (no Docker/Supabase CLI — see __tests__/README.md).

import type { Pool } from "pg";
import type { ContactSubmissionsRepo, OpResult } from "../types";

function asError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

export function createPgContactRepo(pool: Pool): ContactSubmissionsRepo {
  return {
    async hasRecentDuplicate(hash, windowStart): Promise<OpResult<boolean>> {
      try {
        const result = await pool.query(
          `select id from contact_submissions
           where submission_hash = $1 and created_at >= $2
           limit 1`,
          [hash, windowStart.toISOString()],
        );
        return { ok: true, value: (result.rowCount ?? 0) > 0 };
      } catch (err) {
        return { ok: false, error: asError(err) };
      }
    },

    async insertPending({ name, email, message, submissionHash }): Promise<OpResult<{ id: string }>> {
      try {
        const result = await pool.query(
          `insert into contact_submissions (name, email, message, submission_hash, delivery_status)
           values ($1, $2, $3, $4, 'pending')
           returning id`,
          [name, email, message, submissionHash],
        );
        return { ok: true, value: { id: result.rows[0].id as string } };
      } catch (err) {
        return { ok: false, error: asError(err) };
      }
    },

    async markDelivered(id): Promise<OpResult<void>> {
      try {
        await pool.query(`update contact_submissions set delivery_status = 'delivered' where id = $1`, [id]);
        return { ok: true, value: undefined };
      } catch (err) {
        return { ok: false, error: asError(err) };
      }
    },

    async markFailed(id): Promise<OpResult<void>> {
      try {
        await pool.query(`update contact_submissions set delivery_status = 'failed' where id = $1`, [id]);
        return { ok: true, value: undefined };
      } catch (err) {
        return { ok: false, error: asError(err) };
      }
    },
  };
}
