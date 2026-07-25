/**
 * Display-scale pull-quote treatment (DD-003 point 3) for the two lines
 * already identified in COPY.md as deserving special typographic
 * emphasis: "Talent without working hard is nothing." (in the hook) and
 * the closing "You put in the work..." belief statement (in the last
 * beat). Deliberately bigger and more confident than the connective
 * paragraphs around it — size/weight is the hierarchy tool here, per
 * DESIGN_SYSTEM.md's typography-as-hierarchy principle.
 *
 * Purely presentational — no motion of its own. The hook's instance is
 * rendered inside always-visible static markup (about.tsx); the closing
 * beat's instance is rendered inside a <StaggerItem> that supplies the
 * scroll-entrance choreography, so this component doesn't need to own or
 * duplicate that behavior.
 */
export function AboutPullQuote({ text }: { text: string }) {
  return (
    <p className="border-l-2 border-accent py-1 pl-5 font-display text-3xl font-medium leading-[1.15] text-foreground sm:text-4xl md:text-5xl">
      {text}
    </p>
  );
}
