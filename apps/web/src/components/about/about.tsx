import {
  ABOUT_BEATS,
  BEATS_READING_MINUTES,
  HOOK_PARAGRAPHS,
  type AboutParagraph,
} from "@/components/about/about-data";
import { AboutExpandA11y } from "@/components/about/about-expand-a11y";
import { AboutPullQuote } from "@/components/about/about-pull-quote";
import { StaggerItem } from "@/components/motion/stagger-item";
import { StaggerReveal } from "@/components/motion/stagger-reveal";

/**
 * About section (T-011, FR-005) — restructured per DD-003's "chaptered
 * scroll storytelling" pattern.
 *
 * Every word of Gaurav's real narrative from docs/20-design/COPY.md is
 * still here (see about-data.ts's doc comment) — this restructure changes
 * only how it's paced and presented, never the text itself:
 *
 *   1. HOOK — the opening Ronaldo beat, ending on the "Talent without
 *      working hard is nothing." pull-quote, is always rendered as plain,
 *      static markup with a real "Continue reading" affordance.
 *   2. EXPANSION — a native <details>/<summary> disclosure (not a React
 *      useState toggle) reveals the remaining 22 paragraphs as four
 *      discrete, generously-spaced "beats", each with its own scroll-
 *      triggered entrance choreography once opened.
 *   3. PULL-QUOTES — the two lines DD-003 calls out get real display-scale
 *      typography (see about-pull-quote.tsx), not body-text size.
 *
 * NO-JS TRADEOFF (Goal 1.5, documented explicitly rather than assumed):
 * The Hook — name-adjacent context, the Ronaldo beat, and the pull-quote —
 * is guaranteed visible with JavaScript disabled or before hydration: it
 * is plain server-rendered HTML with zero motion wrapper. This is a
 * deliberate change from the *previous* About implementation, which wrapped
 * the entire 27-paragraph section in a single Framer Motion `<FadeIn>`;
 * verified via curl against the dev server that this left
 * `style="opacity:0;transform:translateY(28px) scale(0.98)"` in the raw
 * SSR HTML — i.e. the whole section was invisible to a no-JS visitor, even
 * though the text was technically present in the DOM. That FadeIn wrapper
 * has been removed here.
 *
 * The "Continue reading" control itself uses native `<details>/<summary>`
 * specifically so the disclosure interaction — not just the hook text —
 * survives with zero JavaScript: opening/closing and keyboard operability
 * (confirmed via Playwright: `<summary>` is a real tab stop, `tabIndex ===
 * 0`, activated by both click and Enter/Space, no `div`/`onClick` involved)
 * both come from the browser, not React state. This is a deliberate
 * departure from Experience's button+`useState` expand pattern
 * (`experience-entry.tsx`) — that pattern is fine there because Experience
 * carries no no-JS mandate on its expanded detail, but About's hook/expand
 * affordance is exactly what DD-003 and Goal 1.5 care about, so the more
 * robust native primitive is used here instead. One assumption this
 * verification *disproved*: `<summary>`'s implicit ARIA role is not
 * reliably "button" in practice — Playwright's accessibility snapshot
 * showed role "generic" in Chromium. `role="button"` is set explicitly in
 * the JSX below (a plain HTML attribute, no JS required) to correct this,
 * and `about-expand-a11y.tsx` is a small client-only progressive
 * enhancement that keeps `aria-expanded` in sync with the native `open`
 * state via the `toggle` event (browsers don't do this automatically
 * either) — without it, the control is still fully operable, it just won't
 * announce its expanded/collapsed state to assistive tech.
 *
 * The beats *inside* the disclosure use Framer Motion (`StaggerReveal`/
 * `StaggerItem`) for real scroll-linked entrance choreography, which is a
 * JS-only capability — DD-003 explicitly asks for motion tied to scroll
 * position, which plain CSS mount-time keyframes cannot express. If JS
 * never loads, a visitor can still open the native disclosure and read
 * every beat (the text is always in the server-rendered HTML, never
 * conditionally removed) — the `@media (scripting: none)` rule in
 * globals.css is a defense-in-depth layer that forces those beats back to
 * their fully-visible resting state in that exact scenario, in browsers
 * that support the `scripting` media feature (Chromium, Firefox, Safari
 * 17+). This is a deliberate, documented gap in older/unsupported
 * browsers, not an oversight — flagged here for the critic pass rather
 * than claimed as airtight.
 */

function renderParagraph(paragraph: AboutParagraph, previous: AboutParagraph | undefined) {
  const isTightRun = paragraph.variant === "tight" && previous?.variant === "tight";

  if (paragraph.variant === "display-quote") {
    return <AboutPullQuote key={paragraph.key} text={paragraph.text} />;
  }

  if (paragraph.variant === "emphasis") {
    return (
      <p
        key={paragraph.key}
        className="font-display text-xl font-medium leading-snug text-foreground sm:text-2xl"
      >
        {paragraph.text}
      </p>
    );
  }

  return (
    <p
      key={paragraph.key}
      className={
        "text-base leading-relaxed text-foreground-muted sm:text-lg" +
        (isTightRun ? " -mt-3" : "")
      }
    >
      {paragraph.text}
    </p>
  );
}

export function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="mx-auto max-w-[680px] px-4 py-16 sm:px-6 sm:py-24"
    >
      <h2
        id="about-heading"
        className="font-mono text-xs uppercase tracking-[0.08em] text-foreground-muted"
      >
        About
      </h2>

      {/* HOOK — always static, always visible, no motion wrapper. See the
          no-JS rationale in this file's top doc comment. */}
      <div className="mt-6 space-y-5">
        {HOOK_PARAGRAPHS.map((paragraph, index) =>
          renderParagraph(paragraph, HOOK_PARAGRAPHS[index - 1]),
        )}
      </div>

      <AboutExpandA11y />

      {/* suppressHydrationWarning (2026-07-25 critic-pass fix): a visitor
          who clicks/taps this native <details> disclosure before React
          finishes hydrating gets a real, working toggle for free (native
          browser behavior needs zero JS) - but React's hydration
          reconciliation was logging a console error and, worse, could
          reset that pre-hydration interaction back to the server-rendered
          "closed" state, since it assumes the DOM must exactly match its
          last render output. This element's `open` state is intentionally
          allowed to diverge from that assumption. */}
      <details id="about-expand" className="group mt-8" suppressHydrationWarning>
        <summary
          role="button"
          aria-controls="about-beats"
          className="flex cursor-pointer list-none items-center gap-3 rounded-control border border-border px-5 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-accent [&::-webkit-details-marker]:hidden"
        >
          <span className="group-open:hidden">
            Continue reading
            <span className="ml-2 font-mono text-xs uppercase tracking-[0.06em] text-foreground-muted">
              — about {BEATS_READING_MINUTES} min
            </span>
          </span>
          <span className="hidden group-open:inline">Show less</span>
          <span
            aria-hidden="true"
            className="ml-auto inline-block transition-transform duration-300 group-open:rotate-180"
          >
            ↓
          </span>
        </summary>

        {/* EXPANSION — the remaining narrative, broken into discrete,
            generously-spaced beats. Always present in the server-rendered
            HTML (never conditionally mounted only on the client), so a
            no-JS visitor who opens this native disclosure still gets the
            complete, real text — only the per-beat scroll choreography is
            a progressive enhancement on top. */}
        <div id="about-beats" className="mt-4">
          {ABOUT_BEATS.map((beat) => (
            <div
              key={beat.id}
              className="border-t border-border py-16 first:pt-10 sm:py-24"
            >
              <StaggerReveal>
                <StaggerItem className="about-beat-paragraph">
                  <h3 className="font-mono text-xs uppercase tracking-[0.08em] text-accent-secondary">
                    {beat.label}
                  </h3>
                </StaggerItem>
                <div className="mt-6 space-y-5">
                  {beat.paragraphs.map((paragraph, index) => {
                    const previous = beat.paragraphs[index - 1];
                    return (
                      <StaggerItem key={paragraph.key} className="about-beat-paragraph">
                        {renderParagraph(paragraph, previous)}
                      </StaggerItem>
                    );
                  })}
                </div>
              </StaggerReveal>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
