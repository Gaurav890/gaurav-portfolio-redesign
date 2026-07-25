# Notes content

Versioned posts for the `/notes` section (FR-015), rendered by
`apps/web/src/app/notes/**` and enumerated by `apps/web/src/lib/notes/posts.ts`.
Not a runtime CMS — every post is an `.mdx` file committed here (NON_GOALS.md
NG-005).

Ships with zero posts at launch by design (T-017) — the list page renders the
"more soon, subscribe via RSS" empty state until the first file lands here.

## Adding a post

Two steps — both required:

1. Create `content/notes/<slug>.mdx` (the filename becomes the URL slug at
   `/notes/<slug>`) with this shape:

   ```mdx
   export const metadata = {
     title: "Post title",
     description: "One-sentence summary — used as the list excerpt and OG/meta description.",
     date: "2026-08-01",
     tags: ["ai-agents", "career"],
   };

   Post body in Markdown/MDX starts here.
   ```

2. Add one line to `apps/web/src/lib/notes/registry.ts`:

   ```ts
   "<slug>": () => import("../../../content/notes/<slug>.mdx"),
   ```

   (Why a manual registry instead of auto-discovering files on disk: the
   production bundler, Turbopack, needs a statically resolvable `import()`
   path per post — see that file's comment for the full reasoning. A typo'd
   path here is a build error, not a silent 404.)

- `date` is an ISO `YYYY-MM-DD` string; posts sort newest-first.
- `tags` are freeform, lowercase, kebab-case strings — the tag filter on
  `/notes` and any future RSS feed (T-018) derive their tag list from
  whatever appears in published posts' metadata, so there's no separate tag
  registry to keep in sync.
- GitHub-flavored markdown (tables, strikethrough, task lists) is enabled via
  `remark-gfm`.
