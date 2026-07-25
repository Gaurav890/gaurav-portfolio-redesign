import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatNoteDate } from "@/lib/notes/format-date";
import { getAllNoteSlugs, getNotePost } from "@/lib/notes/posts";

type NotePageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Prerender every post that exists at build time. Returns `[]` while zero
 * posts are authored (valid per generateStaticParams — see
 * node_modules/next/dist/docs/.../generate-static-params.md "you must
 * always return an array, even if empty"). `dynamicParams` is left at its
 * default (`true`) so a post added later renders on first request without
 * a redeploy of this file.
 */
export async function generateStaticParams() {
  return getAllNoteSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: NotePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNotePost(slug);
  if (!post) return {};

  return {
    title: `${post.metadata.title} — Notes — Gaurav Chaulagain`,
    description: post.metadata.description,
    openGraph: {
      title: post.metadata.title,
      description: post.metadata.description,
      type: "article",
      publishedTime: post.metadata.date,
      tags: post.metadata.tags,
    },
  };
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params;
  const post = await getNotePost(slug);
  if (!post) notFound();

  const { metadata, Component } = post;

  return (
    <article className="mx-auto max-w-[680px] px-4 py-16 sm:px-6">
      <Link
        href="/notes"
        className="font-mono text-xs uppercase tracking-wide text-foreground-muted hover:text-accent-secondary"
      >
        &larr; All notes
      </Link>

      <h1 className="mt-4 font-display text-3xl font-medium leading-tight text-foreground sm:text-4xl">
        {metadata.title}
      </h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-wide text-foreground-muted">
        <time dateTime={metadata.date}>{formatNoteDate(metadata.date)}</time>
      </p>

      {metadata.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {metadata.tags.map((tag) => (
            <li key={tag}>
              <Link
                href={`/notes?tag=${encodeURIComponent(tag)}`}
                className="inline-flex items-center rounded-control border border-border px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-foreground-muted hover:border-accent hover:text-foreground"
              >
                {tag}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Component />
      </div>

      {/*
       * RSS-subscribe affordance (UI_PATTERNS.md "Notes list + detail")
       * named but not yet linked — T-018 owns apps/web/app/notes/rss.xml/**
       * and hasn't shipped yet, so this stays prose-only rather than
       * pointing at a route that doesn't exist.
       */}
      <p className="mt-10 border-t border-border pt-6 text-sm text-foreground-muted">
        An RSS feed for Notes is planned — check back soon.
      </p>

      {/*
       * Comment section placeholder for T-023 (backend) / T-024 (frontend
       * UI), per UI_PATTERNS.md "Notes list + detail": "Detail view is a
       * single ~680px reading column with the post body, tags, an
       * RSS-subscribe affordance, and a comment section below the post
       * body." Intentionally not interactive here — no comment form, no
       * fake submit button — just a clearly labeled anchor spot so T-024
       * has an obvious, uncontested place to build.
       */}
      <section aria-label="Comments" className="mt-10 border-t border-border pt-6">
        <p className="font-mono text-xs uppercase tracking-wide text-foreground-muted">
          Comments — coming soon (T-023/T-024)
        </p>
      </section>
    </article>
  );
}
