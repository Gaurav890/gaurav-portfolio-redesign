import { HeroBackground } from "@/components/hero/hero-background";
import { HeroHeadline } from "@/components/hero/hero-headline";
import { HeroStatValue } from "@/components/hero/hero-stat-value";

/**
 * Hero section (T-010, FR-001, AC-001/AC-010).
 *
 * The wrapping <section> and all real text content stay plain, server-
 * rendered markup with no JS dependency (AC-010) — `HeroBackground` is
 * purely decorative (aria-hidden, absolutely positioned, pointer-events
 * disabled) and `HeroHeadline`/`HeroStatValue` render their real,
 * correct text content unconditionally and only layer a client-side
 * enhancement on top once mounted (see each component's own doc comment
 * for exactly how they preserve the no-JS/AC-010 guarantee).
 *
 * 2026-07-25 animation-upgrade pass (DD-002): added the WebGL generative
 * background, GSAP SplitText scramble headline, and GSAP count-up stats
 * on top of the 2026-07-25 motion-polish pass's CSS stagger entrance
 * (kept below, unchanged, for the surrounding chrome).
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
      className="relative mx-auto flex min-h-[100svh] max-w-[1100px] flex-col justify-center overflow-hidden px-4 py-20 sm:px-6"
    >
      <HeroBackground />

      <div className="relative max-w-2xl">
        <p
          className="hero-reveal font-mono text-xs uppercase tracking-[0.08em] text-foreground-muted"
          style={{ "--hero-reveal-delay": "0ms" } as React.CSSProperties}
        >
          Gaurav Chaulagain
        </p>

        <div
          className="hero-reveal mt-4"
          style={{ "--hero-reveal-delay": "80ms" } as React.CSSProperties}
        >
          <HeroHeadline
            id="hero-heading"
            className="font-display text-4xl font-medium leading-[1.1] text-foreground sm:text-5xl md:text-6xl"
          >
            Technical Product Manager — LLMs, AI Agents &amp; Agentic Systems
          </HeroHeadline>
        </div>

        <p
          className="hero-reveal mt-6 max-w-xl text-lg leading-relaxed text-foreground-muted"
          style={{ "--hero-reveal-delay": "180ms" } as React.CSSProperties}
        >
          3.5+ years turning ambiguous problems into shipped products — most
          recently deploying multi-agent systems for enterprise operations at
          FleetPanda.
        </p>

        <dl className="mt-10 grid grid-cols-1 gap-6 border-t border-border pt-8 sm:grid-cols-3">
          {CREDIBILITY_STATS.map((stat, index) => (
            <div
              key={stat.label}
              className="hero-reveal flex flex-col-reverse gap-1"
              style={
                {
                  "--hero-reveal-delay": `${260 + index * 80}ms`,
                } as React.CSSProperties
              }
            >
              <dt className="text-sm text-foreground-muted">{stat.label}</dt>
              <HeroStatValue
                value={stat.value}
                className="font-mono text-3xl font-medium text-accent sm:text-4xl"
              />
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
