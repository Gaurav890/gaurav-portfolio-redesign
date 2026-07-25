/**
 * About section narrative data (T-011 restructure, FR-005, DD-003).
 *
 * Every string of `text` below is copied verbatim, word for word, from
 * docs/20-design/COPY.md's "About section — source narrative" block — the
 * locked, source-of-truth copy captured directly from Gaurav. Nothing here
 * may be paraphrased, trimmed, or reworded. The only editorial decisions
 * made in this file are:
 *   1. Where to cut the narrative into a short "hook" excerpt vs. the rest
 *      of the story (DD-003's "hook state by default").
 *   2. How to group the rest into discrete, generously-spaced "beats" for
 *      the expanded chaptered-scroll state (DD-003 point 2).
 *   3. Which lines get the display-scale pull-quote treatment (DD-003
 *      point 3 — the two lines already treated specially: "Talent without
 *      working hard is nothing." and the closing "You put in the work...").
 *
 * All 27 of the original paragraphs from COPY.md are still present below,
 * split between HOOK_PARAGRAPHS (5) and ABOUT_BEATS (22 across 4 beats).
 * If you ever need to re-verify this, diff the concatenated `text` values
 * here against COPY.md's blockquote — they must match exactly.
 */

export type AboutParagraph = {
  key: string;
  text: string;
  /** Visual treatment — a layout/typography decision only, never a content change. */
  variant?: "display-quote" | "emphasis" | "tight" | "body";
};

/**
 * The hook: the strongest, most self-contained opening beat of the real
 * narrative — the Ronaldo story through the pull-quote that gives the
 * whole About section its throughline. Always rendered as plain, static
 * HTML (no motion wrapper) so it is guaranteed visible with JavaScript
 * disabled or before hydration — see about.tsx's doc comment for the full
 * no-JS rationale.
 */
export const HOOK_PARAGRAPHS: AboutParagraph[] = [
  { key: "p1", text: "There are probably two ideas that explain a lot about me." },
  { key: "p2", text: "The first came from football." },
  {
    key: "p3",
    text: "I grew up a huge Cristiano Ronaldo fan. Not just because of the goals or trophies, but because of what his career seemed to prove: where you start does not have to determine where you finish.",
  },
  {
    key: "p4",
    text: "\"Talent without working hard is nothing.\"",
    variant: "display-quote",
  },
  { key: "p5", text: "That idea stuck with me." },
];

export type AboutBeat = {
  id: string;
  /** Short mono kicker label — the "visible transition cue" between beats. */
  label: string;
  paragraphs: AboutParagraph[];
};

/**
 * The rest of the narrative, broken into discrete beats for the expanded
 * chaptered-scroll state (DD-003 point 2). Revealed only once the visitor
 * opts into "Continue reading" — see about.tsx.
 */
export const ABOUT_BEATS: AboutBeat[] = [
  {
    id: "hard-work",
    label: "The idea that stuck",
    paragraphs: [
      {
        key: "p6",
        text: "I grew up in Nepal, and I was never the person who assumed I would somehow end up working in technology in the United States, building products with teams and customers across the world. Most of the things I have been proudest of have come from being willing to learn something I didn't know, walk into rooms where I was uncomfortable, and keep going long after the exciting part was over.",
      },
      {
        key: "p7",
        text: "But hard work by itself isn't much of a belief system. You have to know what you want to work hard for.",
      },
    ],
  },
  {
    id: "access",
    label: "What I built it for",
    paragraphs: [
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
    ],
  },
  {
    id: "belief",
    label: "What I believe now",
    paragraphs: [
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
    ],
  },
  {
    id: "last-mile",
    label: "The last mile",
    paragraphs: [
      {
        key: "p21",
        text: "That question has taken me through software engineering, product, AI, implementation, and eventually all the way into the messy real world — sitting beside dispatchers, working with drivers, testing hardware attached to trucks, debugging workflows with engineers, and watching carefully when users find completely different ways to use something than we imagined.",
      },
      {
        key: "p22",
        text: 'I\'ve learned to love that last mile between "we built it" and "it actually works for someone."',
      },
    ],
  },
  {
    id: "close",
    label: "Where that leaves me",
    paragraphs: [
      { key: "p23", text: "So there are two beliefs I keep coming back to." },
      { key: "p24", text: "I don't think where you start determines where you can go." },
      { key: "p25", text: "And I don't think technology matters simply because it is impressive." },
      {
        key: "p26",
        text: "You put in the work. You build things that give people more capability. And you stay close enough to the real world to know whether any of it actually mattered.",
        variant: "display-quote",
      },
      { key: "p27", text: "That's more or less how I've ended up here." },
    ],
  },
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * A real (not fabricated) estimated reading time for the beats revealed by
 * "Continue reading" — computed from actual word count at ~200wpm, an
 * honest editorial pacing signal rather than a decorative fake stat.
 *
 * Computed once at module scope (not inside a per-render function call) —
 * ABOUT_BEATS is static data, so there's nothing to recompute on each
 * request; this is the same "hoist static work" principle as
 * `server-hoist-static-io`, applied to a pure derivation instead of I/O.
 */
export const BEATS_READING_MINUTES = Math.max(
  1,
  Math.round(
    ABOUT_BEATS.flatMap((beat) => beat.paragraphs).reduce(
      (total, paragraph) => total + countWords(paragraph.text),
      0,
    ) / 200,
  ),
);
