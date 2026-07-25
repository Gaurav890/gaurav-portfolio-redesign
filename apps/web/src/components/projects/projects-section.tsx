import { FadeIn } from "@/components/motion/fade-in";
import { ProjectCard } from "@/components/projects/project-card";
import { PROJECTS } from "@/components/projects/projects-data";

/**
 * Featured Projects section (T-013, FR-007). Self-contained: owns its own
 * `<section id="projects">` landmark, matching the placeholder shape it
 * replaces in `app/page.tsx` (wired in by the orchestrator in a later
 * integration pass — see the file-ownership note on T-013).
 *
 * Six projects means the "dense" state per the Project card pattern in
 * UI_PATTERNS.md applies at launch: a two-column grid on larger viewports
 * (rather than a tight 3+ column grid) so each card keeps room for real
 * narrative copy instead of feeling cramped.
 */
export function ProjectsSection() {
  return (
    <FadeIn
      as="section"
      id="projects"
      aria-labelledby="projects-heading"
      className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6 sm:py-24"
    >
      <header className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-wide text-foreground-muted">
          Featured projects
        </p>
        <h2
          id="projects-heading"
          className="mt-2 font-display text-2xl font-medium text-foreground sm:text-3xl"
        >
          Things I&apos;ve built and shipped
        </h2>
        <p className="mt-3 text-foreground-muted">
          Six projects, each with the problem it addressed, how it was built,
          and what came of it.
        </p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {PROJECTS.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </FadeIn>
  );
}
