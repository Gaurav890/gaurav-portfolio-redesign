/**
 * Zero-posts empty state — must read as "more soon", not broken (PRD §9
 * "Notes / personal writing" row; UI_PATTERNS.md "Notes list + detail").
 *
 * RSS (T-018) doesn't exist yet, so this deliberately does NOT link to
 * `/notes/rss.xml` (that would be a dead link today) — it names RSS as a
 * forthcoming option in prose instead, satisfying the design intent without
 * shipping a broken affordance.
 */
export function NotesEmptyState() {
  return (
    <div className="mt-10 rounded-card border border-border bg-background-raised px-6 py-10 text-center">
      <p className="font-display text-xl font-medium text-foreground">
        More notes are on the way
      </p>
      <p className="mx-auto mt-3 max-w-md text-foreground-muted">
        This is where candid, personal-voice writing will land — separate
        from the professional blog. Nothing published yet, but check back
        soon; an RSS feed is planned for readers who want to follow along
        without checking back manually.
      </p>
    </div>
  );
}

/** Shown when a tag filter matches zero posts (but posts exist overall). */
export function NotesNoTagMatchState({ tag }: { tag: string }) {
  return (
    <div className="mt-10 rounded-card border border-border bg-background-raised px-6 py-10 text-center">
      <p className="font-display text-xl font-medium text-foreground">
        No notes tagged &ldquo;{tag}&rdquo; yet
      </p>
      <p className="mx-auto mt-3 max-w-md text-foreground-muted">
        Try a different tag, or view all notes.
      </p>
    </div>
  );
}
