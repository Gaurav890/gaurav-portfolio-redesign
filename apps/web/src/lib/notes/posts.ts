import type { ComponentType } from "react";

import { NOTE_MODULE_LOADERS, type NoteMDXModule, type NotePostMetadata } from "./registry";

/**
 * Notes post enumeration and metadata access (FR-015, T-017).
 *
 * Posts are versioned MDX files under `content/notes/**` (NOT a runtime
 * CMS, per NON_GOALS.md NG-005) — each file's frontmatter-equivalent is a
 * plain `export const metadata = {...}` inside the MDX itself (the
 * `@next/mdx` convention: see node_modules/next/dist/docs/01-app/02-guides/
 * mdx.md "Frontmatter"). Which files exist is tracked explicitly in
 * `./registry.ts` rather than discovered via `fs.readdirSync` — see that
 * file's comment for why (Turbopack build-time resolution).
 *
 * This module is the single source of truth for "what posts/tags exist" —
 * the list page, the detail page, and future downstream tasks (T-018 RSS,
 * T-019 sitemap) should all read through `getAllNotePosts()` /
 * `getAllNoteTags()` rather than re-deriving their own list.
 *
 * Ships with zero posts authored at launch (see UI_PATTERNS.md "Notes list
 * + detail" empty state) — every function here behaves correctly against
 * an empty registry.
 */

export type { NotePostMetadata } from "./registry";
export type NotePost = NotePostMetadata & { slug: string };

/** Every published post slug, alphabetical. `[]` at launch, by design. */
export function getAllNoteSlugs(): string[] {
  return Object.keys(NOTE_MODULE_LOADERS).sort();
}

async function loadNoteModule(slug: string): Promise<NoteMDXModule | null> {
  const loader = NOTE_MODULE_LOADERS[slug];
  if (!loader) return null;
  return loader();
}

/** A single post's metadata plus its compiled MDX body, for the detail page. */
export async function getNotePost(slug: string): Promise<{
  metadata: NotePostMetadata;
  Component: ComponentType<Record<string, unknown>>;
} | null> {
  const mod = await loadNoteModule(slug);
  if (!mod) return null;
  return { metadata: mod.metadata, Component: mod.default };
}

/** All posts with metadata, newest first — the source for the list page. */
export async function getAllNotePosts(): Promise<NotePost[]> {
  const slugs = getAllNoteSlugs();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      // Non-null: `slug` was read from the registry's own keys above.
      const mod = (await loadNoteModule(slug)) as NoteMDXModule;
      return { slug, ...mod.metadata };
    }),
  );

  return posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** All posts carrying a given tag, newest first. */
export async function getNotePostsByTag(tag: string): Promise<NotePost[]> {
  const posts = await getAllNotePosts();
  return posts.filter((post) => post.tags.includes(tag));
}

/** Every distinct tag across all posts, alphabetical — used for the tag filter. */
export async function getAllNoteTags(): Promise<string[]> {
  const posts = await getAllNotePosts();
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags) tags.add(tag);
  }
  return Array.from(tags).sort();
}
