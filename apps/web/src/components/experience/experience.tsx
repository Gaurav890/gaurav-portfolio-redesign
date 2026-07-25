import { FadeIn } from "@/components/motion/fade-in";
import { EXPERIENCE_ROLES } from "@/components/experience/experience-data";
import { ExperienceEntry } from "@/components/experience/experience-entry";

/**
 * Experience section (T-012, FR-006).
 *
 * Renders the chronological role timeline using the expandable
 * "Experience timeline entry" pattern from docs/20-design/UI_PATTERNS.md:
 * each entry always shows company/title/dates/location plus a real
 * narrative excerpt, and reveals more narrative on expand via a real
 * keyboard-operable button with `aria-expanded`.
 *
 * NOTE: only five roles are implemented — see the CONTENT GAP comment in
 * experience-data.ts. Verified against both the live production site and
 * docs/00-vision/PRODUCT_CONTEXT.md; no sixth role exists in any source
 * material checked, so none was fabricated to fill a six-role count.
 *
 * Usage (wired up by the orchestrator in a later integration pass):
 *
 *   import { Experience } from "@/components/experience/experience";
 *   // ...
 *   <Experience />
 *
 * This component owns its own <section id="experience"> wrapper (via
 * FadeIn) so it can drop straight into apps/web/src/app/page.tsx in place
 * of the current Experience placeholder block.
 */

// Per UI_PATTERNS.md "dense (6+ roles scrolls within the section rather
// than pushing the whole page length further)". Not triggered today (5
// roles) but kept so the layout stays resilient if a sixth is added later.
const DENSE_THRESHOLD = 6;

export function Experience() {
  const isDense = EXPERIENCE_ROLES.length >= DENSE_THRESHOLD;

  return (
    <FadeIn
      as="section"
      id="experience"
      aria-labelledby="experience-heading"
      className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6 sm:py-24"
    >
      <h2
        id="experience-heading"
        className="font-mono text-xs uppercase tracking-[0.08em] text-foreground-muted"
      >
        Experience
      </h2>

      <ol
        className={
          "mt-8" + (isDense ? " max-h-[720px] overflow-y-auto pr-2" : "")
        }
      >
        {EXPERIENCE_ROLES.map((role) => (
          <ExperienceEntry key={role.id} role={role} />
        ))}
      </ol>
    </FadeIn>
  );
}
