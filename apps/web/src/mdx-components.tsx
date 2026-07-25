import type { MDXComponents } from "mdx/types";

/**
 * Global MDX component overrides — required by `@next/mdx` for App Router
 * (see node_modules/next/dist/docs/01-app/02-guides/mdx.md) and applied to
 * every `.mdx` import in this app, including the dynamically-imported Notes
 * posts (T-017, `src/lib/notes/posts.ts`).
 *
 * Deliberately hand-styled with our own design tokens instead of the
 * Tailwind Typography `prose` plugin, so post bodies follow
 * docs/20-design/DESIGN_SYSTEM.md exactly (serif headings, ~680px reading
 * measure handled by the page shell, monospace for code) rather than
 * Tailwind's default typographic opinions.
 */
const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="mt-10 font-display text-3xl font-medium leading-tight text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-8 font-display text-2xl font-medium leading-tight text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 font-display text-xl font-medium leading-tight text-foreground">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mt-4 text-base leading-relaxed text-foreground first:mt-0 sm:text-lg">
      {children}
    </p>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-accent-secondary underline underline-offset-2 hover:text-accent"
      {...(href?.startsWith("http")
        ? { target: "_blank", rel: "noreferrer noopener" }
        : {})}
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-foreground sm:text-lg">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-relaxed text-foreground sm:text-lg">
      {children}
    </ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-6 border-l-2 border-accent pl-4 text-foreground-muted italic">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded-control bg-background-raised px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mt-6 overflow-x-auto rounded-card border border-border bg-background-raised p-4 font-mono text-sm text-foreground">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-10 border-border" />,
  // GFM tables (remark-gfm, enabled in next.config.ts) need explicit
  // styling — the browser default (no borders/cell spacing) renders
  // columns running together illegibly.
  table: ({ children }) => (
    <div className="mt-6 overflow-x-auto rounded-card border border-border">
      <table className="w-full border-collapse text-left text-sm [&_tbody_tr:last-child_td]:border-b-0 sm:text-base">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-background-raised font-mono text-xs uppercase tracking-wide text-foreground-muted">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-border px-4 py-2 font-medium">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border px-4 py-2 text-foreground">
      {children}
    </td>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
