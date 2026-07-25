import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notes — Gaurav Chaulagain",
  description:
    "Candid notes and writing from Gaurav Chaulagain, distinct from the professional blog.",
};

/**
 * Placeholder route for FR-015 ("Notes"). List + detail pages, tags, RSS,
 * and comments are built in T-017/T-018/T-023/T-024 — this only reserves
 * the route and renders the zero-posts empty state defined in
 * docs/20-design/UI_PATTERNS.md ("Notes list + detail").
 */
export default function NotesPage() {
  return (
    <div className="mx-auto max-w-[680px] px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-medium text-foreground">
        Notes
      </h1>
      <p className="mt-4 text-foreground-muted">
        More soon — candid notes and writing land here shortly. Tags, an RSS
        feed, and comments are on the way.
      </p>
    </div>
  );
}
