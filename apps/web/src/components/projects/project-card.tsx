import type { Project } from "@/components/projects/types";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";

/**
 * A single Featured Project card per the "Project card" pattern in
 * UI_PATTERNS.md: name, tagline, a labeled problem/approach/outcome
 * narrative (never just a tag list), tech-stack tags, and a clearly
 * labeled external link where one exists. The whole card is never one
 * giant click target — the link is its own visible, labeled affordance.
 */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="flex h-full flex-col gap-5 rounded-card border border-border bg-background-raised p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <ProjectThumbnail name={project.name} />
        <div className="min-w-0">
          <h3 className="font-display text-xl font-medium text-foreground">
            {project.name}
          </h3>
          <p className="mt-1 text-sm text-foreground-muted">{project.tagline}</p>
        </div>
      </div>

      {project.highlight ? (
        <p className="w-fit rounded-control bg-accent/10 px-2 py-1 font-mono text-xs font-medium uppercase tracking-wide text-accent">
          {project.highlight}
        </p>
      ) : null}

      <dl className="flex flex-col gap-3 text-sm text-foreground">
        <div>
          <dt className="font-mono text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Problem
          </dt>
          <dd className="mt-1">{project.problem}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Approach
          </dt>
          <dd className="mt-1">{project.approach}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Outcome
          </dt>
          <dd className="mt-1">{project.outcome}</dd>
        </div>
      </dl>

      {project.tech.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={`${project.name} tech stack`}>
          {project.tech.map((tag) => (
            <li
              key={tag}
              className="rounded-control border border-border px-2 py-1 font-mono text-xs uppercase tracking-wide text-foreground-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pt-1">
        {project.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-accent-secondary underline decoration-1 underline-offset-4 transition-colors hover:text-accent"
          >
            {link.label}
            <span aria-hidden="true">↗</span>
          </a>
        ))}

        {project.sparse ? (
          <p className="text-sm italic text-foreground-muted">
            Project link and full tech-stack detail coming soon.
          </p>
        ) : null}
      </div>
    </article>
  );
}
