import Link from "next/link";

type TagFilterProps = {
  tags: string[];
  activeTag: string | null;
  /** Base path to filter within, e.g. "/notes". */
  basePath: string;
};

/**
 * Real, labeled, keyboard-operable tag filter (UI_PATTERNS.md "Notes list +
 * detail" accessibility requirement — never icon-only). Implemented as
 * plain `<Link>`s rather than client-side toggle buttons so filtering is
 * deep-linkable (`?tag=...`) and works with zero JavaScript, per
 * `.claude/rules/frontend.md` ("Make URL state deep-linkable when
 * appropriate").
 */
export function TagFilter({ tags, activeTag, basePath }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <nav aria-label="Filter notes by tag" className="mt-6">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href={basePath}
            aria-current={activeTag === null ? "true" : undefined}
            className={`inline-flex items-center rounded-control border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors ${
              activeTag === null
                ? "border-accent bg-accent text-white"
                : "border-border text-foreground-muted hover:border-accent hover:text-foreground"
            }`}
          >
            All
          </Link>
        </li>
        {tags.map((tag) => {
          const isActive = tag === activeTag;
          return (
            <li key={tag}>
              <Link
                href={`${basePath}?tag=${encodeURIComponent(tag)}`}
                aria-current={isActive ? "true" : undefined}
                className={`inline-flex items-center rounded-control border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors ${
                  isActive
                    ? "border-accent bg-accent text-white"
                    : "border-border text-foreground-muted hover:border-accent hover:text-foreground"
                }`}
              >
                {tag}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
