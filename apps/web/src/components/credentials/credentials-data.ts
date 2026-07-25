import type { Achievement, CommunityRole, EducationEntry } from "@/components/credentials/types";

/** FR-009: degrees, confirmed up to date by Gaurav 2026-07-24 (T-015 note). */
export const EDUCATION: EducationEntry[] = [
  {
    degree: "MS, Computer Science",
    school: "San Francisco Bay University",
    dateRange: "2024–2025",
    detail: "3.8 GPA · ML/AI focus",
  },
  {
    degree: "BS, Computer Science",
    school: "St. Xavier's College",
    dateRange: "2017–2021",
    detail: "4.0 GPA",
  },
];

/** FR-009: honors and certifications. */
export const ACHIEVEMENTS: Achievement[] = [
  { label: "Best Use of Claude", detail: "Cal Hacks 12.0 — ELDA.AI" },
  { label: "Rising Student ICT Award", detail: "Nepal — Dr. Birkhe" },
  {
    label: "FR. Marshall D. Moran Memorial Award",
    detail: "Excellence in Academics, St. Xavier's College",
  },
];

export const CERTIFICATIONS: string[] = [
  "Claude Code",
  "AI Fluency",
  "Google Project Management",
  "Google Cloud Digital Leadership",
  "AI Product Management",
];

/** FR-010: community/leadership — supporting evidence, not a headline. */
export const COMMUNITY: CommunityRole[] = [
  { role: "Founder", org: "SFBU Computer Club" },
  {
    role: "Chief Strategy Officer",
    org: "Entrepreneurship Club",
    detail: "San Francisco Bay University",
  },
];
