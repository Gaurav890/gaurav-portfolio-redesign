// Production ContactSubmissionsRepo implementation, backed by the real
// `@supabase/supabase-js` client (service-role key, server-side only —
// NFR-003/AC-012). See types.ts for the interface this satisfies and
// __tests__/pg-contact-repo.ts for the local-Postgres test double that
// exercises the same query semantics without a live Supabase project.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContactSubmissionsRepo, OpResult } from "./types";

const TABLE = "contact_submissions";

function toError(message: string | undefined, fallback: string): Error {
  return new Error(message && message.length > 0 ? message : fallback);
}

export function createSupabaseContactRepo(client: SupabaseClient): ContactSubmissionsRepo {
  return {
    async hasRecentDuplicate(hash, windowStart): Promise<OpResult<boolean>> {
      const { data, error } = await client
        .from(TABLE)
        .select("id")
        .eq("submission_hash", hash)
        .gte("created_at", windowStart.toISOString())
        .limit(1);

      if (error) {
        return { ok: false, error: toError(error.message, "duplicate check failed") };
      }
      return { ok: true, value: (data?.length ?? 0) > 0 };
    },

    async insertPending({ name, email, message, submissionHash }): Promise<OpResult<{ id: string }>> {
      const { data, error } = await client
        .from(TABLE)
        .insert({
          name,
          email,
          message,
          submission_hash: submissionHash,
          delivery_status: "pending",
        })
        .select("id")
        .single();

      if (error || !data) {
        return { ok: false, error: toError(error?.message, "insert returned no row") };
      }
      return { ok: true, value: { id: data.id as string } };
    },

    async markDelivered(id): Promise<OpResult<void>> {
      const { error } = await client.from(TABLE).update({ delivery_status: "delivered" }).eq("id", id);
      if (error) {
        return { ok: false, error: toError(error.message, "failed to mark delivered") };
      }
      return { ok: true, value: undefined };
    },

    async markFailed(id): Promise<OpResult<void>> {
      const { error } = await client.from(TABLE).update({ delivery_status: "failed" }).eq("id", id);
      if (error) {
        return { ok: false, error: toError(error.message, "failed to mark failed") };
      }
      return { ok: true, value: undefined };
    },
  };
}
