import type { Project } from "@/components/projects/types";

/**
 * The six confirmed Featured Projects (FR-007, PRD.md 2026-07-24 content
 * pass). Dr. Birkhe intentionally ships in the "sparse" content state
 * (`sparse: true`) — its link and tech-stack detail are a residual content
 * gap from OQ-013 that still needs to come from Gaurav; see the note on
 * T-013 in TASKS.jsonl. Do not invent a link or stack for it.
 */
export const PROJECTS: Project[] = [
  {
    slug: "elda-ai",
    name: "ELDA.AI",
    tagline:
      "An AI assistant designed to make eldercare conversations easier — for seniors and the people who care for them.",
    problem:
      "Aging adults and their caregivers often need quick, patient answers about care, medication, and daily support — but most tools are either too clinical or too complicated for someone who just needs a straight answer.",
    approach:
      "Built at Cal Hacks 12.0 with a small team: a conversational assistant powered by the Claude API, wrapped in a React and Node.js front end with a Python service layer, tuned to be patient and plain-spoken rather than clinical.",
    outcome: "Won Best Use of Claude at Cal Hacks 12.0.",
    tech: ["Claude API", "React", "Node.js", "Python"],
    highlight: "Best Use of Claude — Cal Hacks 12.0",
    links: [],
  },
  {
    slug: "aakha-org",
    name: "Aakha.org",
    tagline:
      "A child-sponsorship platform that uses AI-powered matching to connect sponsors with the children who need them.",
    problem:
      "Matching sponsors to children well — not just by availability, but by genuine fit — is usually a slow, manual process that limits how many sponsorships an organization can facilitate.",
    approach:
      "Built a full-stack platform (React, Node.js, Express, PostgreSQL) with an AI-powered matching layer that pairs sponsors and children more thoughtfully than a first-come, first-served list.",
    outcome: "Live at aakha.org, actively facilitating sponsor-to-child matches.",
    tech: ["React", "Node.js", "Express", "PostgreSQL"],
    links: [{ href: "https://aakha.org", label: "Visit aakha.org" }],
  },
  {
    slug: "nepalelection-chat",
    name: "NepalElection.chat",
    tagline:
      "A 24-hour build: bilingual election intelligence covering all 165 of Nepal's constituencies.",
    problem:
      "During an election cycle, voters need fast, trustworthy, bilingual information about candidates and constituencies — most existing sources are scattered, English-only, or too slow to be useful in the moment.",
    approach:
      "Designed and shipped a multi-agent pipeline architecture in 24 hours, powering a bilingual (Nepali/English) chat interface grounded in constituency-level data across all 165 constituencies.",
    outcome:
      "Launched as a working election-intelligence platform covering every constituency in the country, built start to finish in a single day.",
    tech: ["Multi-agent pipelines", "Bilingual chat", "165 constituencies"],
    links: [
      { href: "https://nepalelection.chat", label: "Visit nepalelection.chat" },
    ],
  },
  {
    slug: "vocal-stack",
    name: "vocal-stack",
    tagline: "An open-source TypeScript toolkit for production voice AI agents.",
    problem:
      "Teams building voice AI agents keep reinventing the same unglamorous plumbing — sanitizing messy speech-to-text output, controlling conversational flow, and auditing latency — usually ad hoc and under-tested.",
    approach:
      "Extracted those primitives into vocal-stack, an open-source TypeScript library covering speech sanitizing, flow control, and latency auditing, published so other builders don't have to start from scratch.",
    outcome: "Published on npm and open-sourced on GitHub.",
    tech: ["TypeScript", "npm"],
    links: [
      {
        href: "https://github.com/gaurav890/vocal-stack",
        label: "View on GitHub",
      },
    ],
  },
  {
    slug: "aquaoracle",
    name: "AquaOracle",
    tagline:
      "A terminal-based, fully local RAG platform for water-safety and regulatory compliance.",
    problem:
      "Compliance and water-safety teams need to query dense regulatory documentation quickly — without sending sensitive data out to a third-party cloud API.",
    approach:
      "Built a fully local retrieval-augmented-generation platform with a four-stage retrieval pipeline, running entirely offline with Python, Ollama for local inference, and Qdrant for vector search.",
    outcome:
      "Open-sourced on GitHub as a fully local, four-stage retrieval pipeline.",
    tech: ["Python", "Ollama", "Qdrant"],
    links: [
      {
        href: "https://github.com/Gaurav890/AquaOracle",
        label: "View on GitHub",
      },
    ],
  },
  {
    slug: "dr-birkhe",
    name: "Dr. Birkhe",
    tagline:
      "A bilingual Nepali-English health chatbot — and the project that changed how I think about technology.",
    problem:
      "In Nepal, people would often ignore symptoms, feel embarrassed asking certain health questions, or simply have no easy way to find reliable health information in a language they were comfortable using.",
    approach:
      "Built with friends in college as a bilingual Nepali-English health chatbot, focused on making it easier to ask a question, understand the medicine, and figure out whether to seek help.",
    outcome:
      "Won Nepal's Rising Student ICT Award — and became the project that shaped a belief carried into everything built since: technology is most interesting when it expands what a person is capable of doing.",
    tech: [],
    links: [],
    sparse: true,
  },
];
