import { FadeIn } from "@/components/motion/fade-in";

/**
 * About section (T-011, FR-005).
 *
 * Renders the verbatim narrative from docs/20-design/COPY.md's "About
 * section — source narrative" block. Every word below is copied exactly
 * from that source (the Ronaldo / Dr. Birkhe / Fei-Fei Li throughline) —
 * only paragraph breaks, emphasis, and the pull-quote treatment are a
 * typography/layout decision, per that doc's instruction that copy "must
 * not alter the underlying facts or invent details beyond this." Do not
 * edit the wording in NARRATIVE_PARAGRAPHS below without going back to
 * COPY.md and updating both in the same change.
 *
 * Usage (wired up by the orchestrator in a later integration pass):
 *
 *   import { About } from "@/components/about/about";
 *   // ...
 *   <About />
 *
 * This component owns its own <section id="about"> wrapper (via FadeIn) so
 * it can drop straight into apps/web/src/app/page.tsx in place of the
 * current About placeholder block.
 */

type Paragraph = {
  key: string;
  text: string;
  /** Visual treatment — a layout/typography choice only, per COPY.md. */
  variant?: "quote" | "emphasis" | "tight";
};

const NARRATIVE_PARAGRAPHS: Paragraph[] = [
  { key: "p1", text: "There are probably two ideas that explain a lot about me." },
  { key: "p2", text: "The first came from football." },
  {
    key: "p3",
    text: "I grew up a huge Cristiano Ronaldo fan. Not just because of the goals or trophies, but because of what his career seemed to prove: where you start does not have to determine where you finish.",
  },
  { key: "p4", text: "\"Talent without working hard is nothing.\"", variant: "quote" },
  { key: "p5", text: "That idea stuck with me." },
  {
    key: "p6",
    text: "I grew up in Nepal, and I was never the person who assumed I would somehow end up working in technology in the United States, building products with teams and customers across the world. Most of the things I have been proudest of have come from being willing to learn something I didn't know, walk into rooms where I was uncomfortable, and keep going long after the exciting part was over.",
  },
  {
    key: "p7",
    text: "But hard work by itself isn't much of a belief system. You have to know what you want to work hard for.",
  },
  { key: "p8", text: "I think I started figuring that part out in college." },
  {
    key: "p9",
    text: "In 2020, some friends and I were thinking about healthcare access in Nepal. There were people who would ignore symptoms, feel embarrassed asking certain questions, or simply have no easy way to find reliable health information in a language they were comfortable using.",
  },
  { key: "p10", text: "So we built something." },
  {
    key: "p11",
    text: "Part of it was Dr. Birkhe, a bilingual Nepali-English health chatbot. At the time I was fascinated by the AI behind it. But what changed me wasn't getting the model to respond correctly.",
  },
  {
    key: "p12",
    text: "It was realizing that somebody could use something we had built to do something they couldn't easily do before.",
  },
  { key: "p13", text: "Ask the question.", variant: "tight" },
  { key: "p14", text: "Understand the medicine.", variant: "tight" },
  { key: "p15", text: "Figure out whether they should seek help.", variant: "tight" },
  {
    key: "p16",
    text: "Our project eventually won Nepal's Rising Student ICT Award. I was incredibly proud of it. But years later, the award isn't really the part I think about.",
  },
  { key: "p17", text: "I think about access." },
  {
    key: "p18",
    text: "That experience gave me a belief I have carried into almost everything I've worked on since:",
  },
  {
    key: "p19",
    text: "Technology is most interesting when it expands what a person is capable of doing.",
    variant: "emphasis",
  },
  {
    key: "p20",
    text: "It's also why I've become drawn to the human-centered view of AI championed by people like Fei-Fei Li. The models will get better. The interfaces will change. What matters to me is what happens on the other side: Who can suddenly do something they couldn't do before? Who gets access to expertise they didn't have? Who gets hours of their life back? Who feels more capable because the technology exists?",
  },
  {
    key: "p21",
    text: "That question has taken me through software engineering, product, AI, implementation, and eventually all the way into the messy real world — sitting beside dispatchers, working with drivers, testing hardware attached to trucks, debugging workflows with engineers, and watching carefully when users find completely different ways to use something than we imagined.",
  },
  {
    key: "p22",
    text: 'I\'ve learned to love that last mile between "we built it" and "it actually works for someone."',
  },
  { key: "p23", text: "So there are two beliefs I keep coming back to." },
  { key: "p24", text: "I don't think where you start determines where you can go." },
  { key: "p25", text: "And I don't think technology matters simply because it is impressive." },
  {
    key: "p26",
    text: "You put in the work. You build things that give people more capability. And you stay close enough to the real world to know whether any of it actually mattered.",
    variant: "emphasis",
  },
  { key: "p27", text: "That's more or less how I've ended up here." },
];

export function About() {
  return (
    <FadeIn
      as="section"
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

      <div className="mt-6 space-y-5">
        {NARRATIVE_PARAGRAPHS.map((paragraph, index) => {
          const previous = NARRATIVE_PARAGRAPHS[index - 1];
          const isTightRun = paragraph.variant === "tight" && previous?.variant === "tight";

          if (paragraph.variant === "quote") {
            return (
              <blockquote
                key={paragraph.key}
                className="border-l-2 border-accent py-1 pl-5 font-display text-2xl italic leading-snug text-foreground sm:text-3xl"
              >
                {paragraph.text}
              </blockquote>
            );
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
        })}
      </div>
    </FadeIn>
  );
}
