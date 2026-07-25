// The actual knowledge-base content (T-033, FR-013).
//
// Source-of-truth discipline (per this task's brief and ADR-001 D8's threat
// list — "Injection via the knowledge base itself... the KB is built only
// from versioned repo content Gaurav authored"):
//
//   - Experience / Projects / Credentials facts are imported directly from
//     the exact same data modules that render the site
//     (experience-data.ts, projects-data.ts, credentials-data.ts). This is
//     deliberate, not a convenience: it means the knowledge base cannot
//     drift out of sync with the rendered site without a compile error
//     (T-033's own task notes flag "must stay in sync with content changes"
//     as an ongoing maintenance risk — importing the real modules is the
//     mitigation, not just a note in a doc).
//   - The About narrative is copied verbatim from
//     docs/20-design/COPY.md's "About section — source narrative" block
//     (the same source about.tsx itself is built from — see that
//     component's own header comment). It is not imported from about.tsx
//     directly because that file is a React/JSX component (pulls in
//     framer-motion) and does not export its paragraph data; COPY.md is the
//     named source of truth for this content per this task's brief.
//   - Contact/CTA details are imported from the real contact-actions
//     constants module, so the wrap-up message (AC-016) never hands out a
//     stale email or Calendly link.
//
// Nothing below is paraphrased, estimated, or invented beyond what these
// source files already say.

import {
  CALENDLY_URL,
  CONTACT_EMAIL,
  RESUME_DOWNLOAD_FILENAME,
} from "@/components/contact-actions/constants";
import { EXPERIENCE_ROLES } from "@/components/experience/experience-data";
import { PROJECTS } from "@/components/projects/projects-data";
import {
  ACHIEVEMENTS,
  CERTIFICATIONS,
  COMMUNITY,
  EDUCATION,
} from "@/components/credentials/credentials-data";

import type { KnowledgeChunk } from "./types";

// Verbatim from docs/20-design/COPY.md "About section — source narrative"
// (captured 2026-07-24). Do not edit the wording here without updating
// COPY.md in the same change — same rule about.tsx's own header comment
// states for its copy of this text.
const ABOUT_NARRATIVE = `There are probably two ideas that explain a lot about me.

The first came from football. I grew up a huge Cristiano Ronaldo fan. Not just because of the goals or trophies, but because of what his career seemed to prove: where you start does not have to determine where you finish. "Talent without working hard is nothing." That idea stuck with me.

I grew up in Nepal, and I was never the person who assumed I would somehow end up working in technology in the United States, building products with teams and customers across the world. Most of the things I have been proudest of have come from being willing to learn something I didn't know, walk into rooms where I was uncomfortable, and keep going long after the exciting part was over.

But hard work by itself isn't much of a belief system. You have to know what you want to work hard for. I think I started figuring that part out in college.

In 2020, some friends and I were thinking about healthcare access in Nepal. There were people who would ignore symptoms, feel embarrassed asking certain questions, or simply have no easy way to find reliable health information in a language they were comfortable using. So we built something.

Part of it was Dr. Birkhe, a bilingual Nepali-English health chatbot. At the time I was fascinated by the AI behind it. But what changed me wasn't getting the model to respond correctly. It was realizing that somebody could use something we had built to do something they couldn't easily do before. Ask the question. Understand the medicine. Figure out whether they should seek help.

Our project eventually won Nepal's Rising Student ICT Award. I was incredibly proud of it. But years later, the award isn't really the part I think about. I think about access.

That experience gave me a belief I have carried into almost everything I've worked on since: technology is most interesting when it expands what a person is capable of doing.

It's also why I've become drawn to the human-centered view of AI championed by people like Fei-Fei Li. The models will get better. The interfaces will change. What matters to me is what happens on the other side: Who can suddenly do something they couldn't do before? Who gets access to expertise they didn't have? Who gets hours of their life back? Who feels more capable because the technology exists?

That question has taken me through software engineering, product, AI, implementation, and eventually all the way into the messy real world — sitting beside dispatchers, working with drivers, testing hardware attached to trucks, debugging workflows with engineers, and watching carefully when users find completely different ways to use something than we imagined. I've learned to love that last mile between "we built it" and "it actually works for someone."

So there are two beliefs I keep coming back to. I don't think where you start determines where you can go. And I don't think technology matters simply because it is impressive. You put in the work. You build things that give people more capability. And you stay close enough to the real world to know whether any of it actually mattered.

That's more or less how I've ended up here.`;

function experienceChunks(): KnowledgeChunk[] {
  return EXPERIENCE_ROLES.map((role) => ({
    id: `experience-${role.id}`,
    section: "experience",
    title: `${role.title} at ${role.company}`,
    keywords: [
      role.company,
      role.title,
      role.location,
      role.dates,
      "experience",
      "work history",
      "career",
      "role",
      "job",
    ],
    text: `${role.title} at ${role.company} (${role.dates}, ${role.location}). ${role.excerpt} ${role.expanded}`,
  }));
}

function projectChunks(): KnowledgeChunk[] {
  return PROJECTS.map((project) => ({
    id: `project-${project.slug}`,
    section: "projects",
    title: project.name,
    keywords: [
      project.name,
      "project",
      "built",
      "shipped",
      ...project.tech,
      ...(project.highlight ? [project.highlight] : []),
    ],
    text: [
      `${project.name}: ${project.tagline}`,
      `Problem: ${project.problem}`,
      `Approach: ${project.approach}`,
      `Outcome: ${project.outcome}`,
      project.tech.length > 0 ? `Tech: ${project.tech.join(", ")}.` : "",
      project.sparse
        ? "(This project's public link/tech-stack details aren't published yet.)"
        : "",
    ]
      .filter(Boolean)
      .join(" "),
  }));
}

function credentialsChunks(): KnowledgeChunk[] {
  const educationText = EDUCATION.map(
    (entry) => `${entry.degree}, ${entry.school} (${entry.dateRange})${entry.detail ? ` — ${entry.detail}` : ""}`,
  ).join(" ");
  const achievementsText = ACHIEVEMENTS.map(
    (entry) => `${entry.label}${entry.detail ? ` (${entry.detail})` : ""}`,
  ).join(", ");
  const certificationsText = CERTIFICATIONS.join(", ");
  const communityText = COMMUNITY.map(
    (entry) => `${entry.role}${entry.org ? ` at ${entry.org}` : ""}${entry.detail ? ` (${entry.detail})` : ""}`,
  ).join(", ");

  return [
    {
      id: "credentials-education",
      section: "credentials",
      title: "Education",
      keywords: ["education", "degree", "school", "university", "college", "gpa", "study"],
      text: `Education: ${educationText}`,
    },
    {
      id: "credentials-achievements",
      section: "credentials",
      title: "Achievements and awards",
      keywords: ["award", "achievement", "honor", "won", "prize", "recognition"],
      text: `Awards and honors: ${achievementsText}.`,
    },
    {
      id: "credentials-certifications",
      section: "credentials",
      title: "Certifications",
      keywords: ["certification", "certified", "credential", "course"],
      text: `Certifications: ${certificationsText}.`,
    },
    {
      id: "credentials-community",
      section: "credentials",
      title: "Community and leadership",
      keywords: ["community", "leadership", "club", "founder", "volunteer"],
      text: `Community and leadership: ${communityText}.`,
    },
  ];
}

function identityChunks(): KnowledgeChunk[] {
  return [
    {
      id: "identity-core",
      section: "identity",
      title: "Who Gaurav is",
      keywords: ["who", "gaurav", "about", "background", "bio", "introduce"],
      text:
        "Gaurav Chaulagain is a technical product manager focused on AI/agentic products. He is currently a Technical Project Manager at FleetPanda, and previously worked at fAIshion Inc., WP Creative, Hazesoft, and the Blind Women Association of Nepal. He is from Nepal and now works in the United States.",
      alwaysInclude: true,
    },
    {
      id: "identity-voice-throughlines",
      section: "identity",
      title: "Personality and throughlines",
      keywords: ["personality", "philosophy", "believe", "values", "voice"],
      text:
        "Two ideas run through almost everything Gaurav says about himself: (1) Where you start doesn't determine where you finish — talent without hard work is nothing (the Cristiano Ronaldo influence). (2) Technology matters when it expands what a person is capable of doing, not because it's impressive on its own (the Dr. Birkhe / human-centered-AI thread, echoing Fei-Fei Li's view). He's warm, narrative, and willing to joke — not a flat corporate Q&A bot.",
      alwaysInclude: true,
    },
    {
      id: "about-narrative",
      section: "about",
      title: "Gaurav's own story, in his words",
      keywords: [
        "story",
        "ronaldo",
        "football",
        "nepal",
        "dr. birkhe",
        "health chatbot",
        "fei-fei li",
        "belief",
        "why",
      ],
      text: ABOUT_NARRATIVE,
    },
  ];
}

function contactChunks(): KnowledgeChunk[] {
  return [
    {
      id: "contact-ctas",
      section: "contact",
      title: "How to actually reach Gaurav",
      keywords: ["contact", "reach", "email", "call", "resume", "hire", "connect", "schedule"],
      text: `The best ways to follow up with Gaurav directly: book a 20-minute call at ${CALENDLY_URL}, send an email to ${CONTACT_EMAIL}, or download his resume (${RESUME_DOWNLOAD_FILENAME}) from the site's Contact section.`,
      alwaysInclude: true,
    },
  ];
}

/**
 * The full knowledge base, assembled once at module load. Small enough at
 * this scale (personal portfolio, a few dozen chunks) that no vector store
 * or embeddings pipeline is warranted — see retrieval.ts's keyword-scoring
 * approach and this task's brief for why that's a deliberate choice, not a
 * shortcut.
 */
export const KNOWLEDGE_BASE: KnowledgeChunk[] = [
  ...identityChunks(),
  ...experienceChunks(),
  ...projectChunks(),
  ...credentialsChunks(),
  ...contactChunks(),
];
