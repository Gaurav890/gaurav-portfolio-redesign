import type { ComponentType } from "react";

export type NotePostMetadata = {
  /** Serif-rendered post title. */
  title: string;
  /** One-line summary used as the list-page excerpt and OG/meta description. */
  description: string;
  /** ISO 8601 date string, e.g. "2026-08-01". */
  date: string;
  /** Lowercase, kebab-case tags (e.g. "ai-agents", "career"). */
  tags: string[];
};

/** The shape of a compiled `.mdx` module, per @types/mdx + the `metadata` export convention. */
export type NoteMDXModule = {
  default: ComponentType<Record<string, unknown>>;
  metadata: NotePostMetadata;
};

/**
 * Explicit slug -> module-loader registry for Notes posts (T-017, FR-015).
 *
 * Turbopack (the default bundler — see next.config.ts) needs statically
 * resolvable import specifiers. A directory-scan (`fs.readdirSync`) plus a
 * dynamic `import(`...${slug}.mdx`)` expression fails the production build
 * as soon as the content directory has zero matching files — which it does
 * at launch, by design (see content/notes/README.md) — because there's
 * nothing for the bundler to build a module graph from. This explicit
 * registry sidesteps that: each entry is a normal static `import()`, so it
 * compiles correctly with zero entries and stays a build-time-verified
 * reference (a typo'd path is a build error here, never a silent 404) as
 * posts are added.
 *
 * To publish a post: create `content/notes/<slug>.mdx`, then add one line
 * below. `src/lib/notes/posts.ts` is the only other file that should ever
 * import from this registry.
 */
export const NOTE_MODULE_LOADERS: Record<string, () => Promise<NoteMDXModule>> =
  {
    // "my-first-post": () => import("../../../content/notes/my-first-post.mdx"),
  };
