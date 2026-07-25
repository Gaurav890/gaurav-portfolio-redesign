import { FadeIn } from "@/components/motion/fade-in";
import {
  ACHIEVEMENTS,
  CERTIFICATIONS,
  COMMUNITY,
  EDUCATION,
} from "@/components/credentials/credentials-data";

/**
 * Education, Achievements & Community section (T-015, FR-009/FR-010).
 * Self-contained: owns its own `<section id="credentials">` landmark,
 * matching the placeholder shape it replaces in `app/page.tsx` (wired in
 * by the orchestrator — see the file-ownership note on T-015).
 *
 * Deliberately visually secondary to Experience/Projects per
 * DESIGN_SYSTEM.md's hierarchy guidance and FR-009/FR-010 ("does not
 * dominate the page", "supporting evidence... not a headline section"):
 * a smaller heading size than Projects/Events, a compact three-column
 * scannable layout instead of narrative cards, and no card
 * borders/shadows — just hairline rules.
 */
export function CredentialsSection() {
  return (
    <FadeIn
      as="section"
      id="credentials"
      aria-labelledby="credentials-heading"
      className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6 sm:py-20"
    >
      <header>
        <p className="font-mono text-xs uppercase tracking-wide text-foreground-muted">
          Credentials
        </p>
        <h2
          id="credentials-heading"
          className="mt-2 font-display text-xl font-medium text-foreground sm:text-2xl"
        >
          Education, achievements &amp; community
        </h2>
      </header>

      <div className="mt-8 grid gap-10 sm:grid-cols-3">
        <section aria-labelledby="credentials-education-heading">
          <h3
            id="credentials-education-heading"
            className="font-mono text-xs font-medium uppercase tracking-wide text-foreground-muted"
          >
            Education
          </h3>
          <ul className="mt-3 flex flex-col gap-4">
            {EDUCATION.map((entry) => (
              <li key={entry.degree}>
                <p className="text-sm font-medium text-foreground">
                  {entry.degree}
                </p>
                <p className="text-sm text-foreground-muted">{entry.school}</p>
                <p className="mt-0.5 font-mono text-xs text-foreground-muted">
                  {entry.dateRange} · {entry.detail}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="credentials-achievements-heading">
          <h3
            id="credentials-achievements-heading"
            className="font-mono text-xs font-medium uppercase tracking-wide text-foreground-muted"
          >
            Achievements
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {ACHIEVEMENTS.map((achievement) => (
              <li key={achievement.label}>
                <p className="text-sm font-medium text-foreground">
                  {achievement.label}
                </p>
                {achievement.detail ? (
                  <p className="text-sm text-foreground-muted">
                    {achievement.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          <h4 className="mt-5 font-mono text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Certifications
          </h4>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Certifications">
            {CERTIFICATIONS.map((certification) => (
              <li
                key={certification}
                className="rounded-control border border-border px-2 py-1 font-mono text-xs text-foreground-muted"
              >
                {certification}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="credentials-community-heading">
          <h3
            id="credentials-community-heading"
            className="font-mono text-xs font-medium uppercase tracking-wide text-foreground-muted"
          >
            Community
          </h3>
          <ul className="mt-3 flex flex-col gap-4">
            {COMMUNITY.map((role) => (
              <li key={`${role.role}-${role.org}`}>
                <p className="text-sm font-medium text-foreground">
                  {role.role}
                </p>
                <p className="text-sm text-foreground-muted">{role.org}</p>
                {role.detail ? (
                  <p className="mt-0.5 font-mono text-xs text-foreground-muted">
                    {role.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </FadeIn>
  );
}
