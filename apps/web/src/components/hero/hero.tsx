/**
 * Hero section (T-010, FR-001, AC-001/AC-010).
 *
 * Deliberately a plain server component — no "use client", no FadeIn/motion
 * wrapper. AC-010 requires name, role framing, and the credibility stats to
 * be present in server-rendered HTML with no JS dependency, matching the
 * reasoning already recorded on the T-001 placeholder this replaces. Do not
 * wrap this in <FadeIn> or add client-only interactivity.
 *
 * Usage (wired up by the orchestrator in a later integration pass):
 *
 *   import { Hero } from "@/components/hero/hero";
 *   // ...
 *   <Hero />
 *
 * This component owns its own <section id="hero"> wrapper so it can drop
 * straight into apps/web/src/app/page.tsx in place of the current hero
 * placeholder block.
 */

const CREDIBILITY_STATS = [
  { value: "3.5+", label: "Years of experience" },
  { value: "$1.7M+", label: "Contract value delivered" },
  { value: "6+", label: "Agentic projects shipped" },
] as const;

export function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="mx-auto flex min-h-[100svh] max-w-[1100px] flex-col justify-center px-4 py-20 sm:px-6"
    >
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-foreground-muted">
          Gaurav Chaulagain
        </p>

        <h1
          id="hero-heading"
          className="mt-4 font-display text-4xl font-medium leading-[1.1] text-foreground sm:text-5xl md:text-6xl"
        >
          Technical Product Manager — LLMs, AI Agents &amp; Agentic Systems
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground-muted">
          3.5+ years turning ambiguous problems into shipped products — most
          recently deploying multi-agent systems for enterprise operations at
          FleetPanda.
        </p>

        <dl className="mt-10 grid grid-cols-1 gap-6 border-t border-border pt-8 sm:grid-cols-3">
          {CREDIBILITY_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse gap-1">
              <dt className="text-sm text-foreground-muted">{stat.label}</dt>
              <dd className="font-mono text-3xl font-medium text-accent sm:text-4xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
