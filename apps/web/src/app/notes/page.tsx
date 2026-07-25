import type { Metadata } from "next";

import { NotesEmptyState, NotesNoTagMatchState } from "@/components/notes/empty-state";
import { NotesPagination } from "@/components/notes/pagination";
import { PostCard } from "@/components/notes/post-card";
import { TagFilter } from "@/components/notes/tag-filter";
import { getAllNotePosts, getAllNoteTags } from "@/lib/notes/posts";

export const metadata: Metadata = {
  title: "Notes — Gaurav Chaulagain",
  description:
    "Candid notes and writing from Gaurav Chaulagain, distinct from the professional blog.",
};

const POSTS_PER_PAGE = 10;

type NotesPageProps = {
  searchParams: Promise<{ tag?: string; page?: string }>;
};

/**
 * Notes list page (FR-015, T-017): tag-filterable, paginated list of
 * versioned MDX posts, or the "more soon" empty state at zero posts. Filter
 * and page are both real URL state (`?tag=`, `?page=`) — deep-linkable and
 * functional without client JS, per `.claude/rules/frontend.md`.
 */
export default async function NotesPage({ searchParams }: NotesPageProps) {
  const resolvedSearchParams = await searchParams;
  const activeTag = resolvedSearchParams.tag ?? null;

  const [allPosts, allTags] = await Promise.all([
    getAllNotePosts(),
    getAllNoteTags(),
  ]);

  const filteredPosts = activeTag
    ? allPosts.filter((post) => post.tags.includes(activeTag))
    : allPosts;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPosts.length / POSTS_PER_PAGE),
  );
  const currentPage = Math.min(
    Math.max(1, Number(resolvedSearchParams.page) || 1),
    totalPages,
  );
  const pagePosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  function buildHref(targetPage: number): string {
    const params = new URLSearchParams();
    if (activeTag) params.set("tag", activeTag);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/notes?${query}` : "/notes";
  }

  return (
    <div className="mx-auto max-w-[680px] px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-medium text-foreground">
        Notes
      </h1>
      <p className="mt-4 text-foreground-muted">
        Candid thoughts, opinions, and reflections — distinct from the
        professional blog. Versioned, written, and posted here directly.
      </p>

      <TagFilter tags={allTags} activeTag={activeTag} basePath="/notes" />

      {allPosts.length === 0 ? (
        <NotesEmptyState />
      ) : filteredPosts.length === 0 && activeTag ? (
        <NotesNoTagMatchState tag={activeTag} />
      ) : (
        <>
          <ul className="mt-8">
            {pagePosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </ul>
          <NotesPagination
            currentPage={currentPage}
            totalPages={totalPages}
            buildHref={buildHref}
          />
        </>
      )}
    </div>
  );
}
