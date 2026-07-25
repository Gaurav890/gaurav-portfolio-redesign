/**
 * The launch-state "nothing scheduled right now" treatment (FR-014, PRD.md
 * §9 Events row, OQ-014): shown only when both Attended and Upcoming are
 * empty, so the section reads as one intentional message rather than two
 * empty grid headers. A dashed border (instead of the solid hairline used
 * for populated cards elsewhere) is the deliberate visual cue that this
 * space is reserved for future content, not a broken/missing section.
 */
export function EventsEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border px-6 py-12 text-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-8 w-8 text-foreground-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M3.5 10h17" strokeLinecap="round" />
      </svg>
      <p className="max-w-sm text-foreground-muted">
        Nothing scheduled right now — check back soon. Between hackathons,
        conferences, and meetups, this list doesn&apos;t stay empty for long.
      </p>
    </div>
  );
}
