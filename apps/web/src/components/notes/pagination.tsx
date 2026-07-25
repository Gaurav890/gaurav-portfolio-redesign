import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  /** Base path + any active filters, e.g. "/notes?tag=career". */
  buildHref: (page: number) => string;
};

/**
 * Real prev/next links (not buttons requiring JS) for the "dense" Notes
 * state — UI_PATTERNS.md: "many posts uses pagination, not one long
 * unstyled scroll." Only renders once there's more than one page.
 */
export function NotesPagination({
  currentPage,
  totalPages,
  buildHref,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Notes pagination"
      className="mt-10 flex items-center justify-between border-t border-border pt-6"
    >
      {hasPrev ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="text-sm font-medium text-foreground hover:text-accent-secondary"
        >
          &larr; Newer notes
        </Link>
      ) : (
        <span />
      )}
      <p className="font-mono text-xs uppercase tracking-wide text-foreground-muted">
        Page {currentPage} of {totalPages}
      </p>
      {hasNext ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="text-sm font-medium text-foreground hover:text-accent-secondary"
        >
          Older notes &rarr;
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
