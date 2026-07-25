import Link from "next/link";

import { formatNoteDate } from "@/lib/notes/format-date";
import type { NotePost } from "@/lib/notes/posts";

/**
 * A single Notes list-row: serif title, unambiguous date, monospace tags,
 * short excerpt — per UI_PATTERNS.md "Notes list + detail". Always renders
 * full-width as a single-column list (not a card grid), so a sparse count
 * (1-2 posts) still reads intentional rather than stretched to fill a grid
 * meant for many.
 */
export function PostCard({ post }: { post: NotePost }) {
  return (
    <li className="border-b border-border py-6 first:pt-0 last:border-b-0">
      <article>
        <h2 className="font-display text-xl font-medium text-foreground sm:text-2xl">
          <Link
            href={`/notes/${post.slug}`}
            className="hover:text-accent-secondary"
          >
            {post.title}
          </Link>
        </h2>
        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-foreground-muted">
          <time dateTime={post.date}>{formatNoteDate(post.date)}</time>
        </p>
        <p className="mt-3 text-foreground-muted">{post.description}</p>
        {post.tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-control border border-border px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-foreground-muted"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </article>
    </li>
  );
}
