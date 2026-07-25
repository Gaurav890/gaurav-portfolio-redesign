/**
 * Experience role data (T-012, FR-006).
 *
 * Facts (company, title, dates, location, accomplishment metrics) are
 * sourced from the live production site at gauravchaulagain.com (fetched
 * 2026-07-24 as part of this task, since docs/00-vision/PRODUCT_CONTEXT.md
 * names the same five employers but doesn't carry per-role titles/dates/
 * accomplishments) — cross-checked against PRODUCT_CONTEXT.md's employer
 * list (FleetPanda, fAIshion Inc., WP Creative, Hazesoft, Blind Women
 * Association of Nepal), which matches exactly. `excerpt`/`expanded` copy is
 * a narrative-framed rewrite of those same facts (numbers/claims unchanged),
 * per this task's TASKS.jsonl note: "Facts unchanged from current site;
 * tone reframed as story-driven copy per user request 2026-07-24."
 *
 * CONTENT GAP: the live site and PRODUCT_CONTEXT.md both list exactly five
 * roles — there is no sixth Experience role anywhere in the source material
 * checked. This task's brief assumed six; that assumption does not match
 * verified reality. No sixth entry has been fabricated to fill the count —
 * flagged explicitly here and in this task's final report for the
 * orchestrator/Gaurav to confirm one way or the other (add a real sixth role
 * or correct the expected count) during the content-completion pass
 * (OQ-001).
 */

export type ExperienceRole = {
  id: string;
  company: string;
  title: string;
  dates: string;
  location: string;
  /** Always-visible narrative excerpt, per UI_PATTERNS.md "Experience timeline entry" — never bare metadata. */
  excerpt: string;
  /** Additional narrative revealed on expand. */
  expanded: string;
};

export const EXPERIENCE_ROLES: ExperienceRole[] = [
  {
    id: "fleetpanda",
    company: "FleetPanda",
    title: "Technical Project Manager",
    dates: "May 2026 – Present",
    location: "San Francisco Bay Area, CA (Hybrid)",
    excerpt:
      "Manages end-to-end implementation across 7 enterprise fuel-distributor accounts worth $1.7M+ in contract value — deploying multi-agent systems that draft emails, extract call transcripts, and escalate risk automatically.",
    expanded:
      "The goal isn't to replace an account team's judgment, it's to scale engagement quality across accounts without sacrificing depth — so seven enterprise relationships get the kind of attention one account used to get.",
  },
  {
    id: "faishion",
    company: "fAIshion Inc.",
    title: "AI Product Manager — Fashion AI Agent",
    dates: "Jul 2025 – Oct 2025",
    location: "San Francisco, CA",
    excerpt:
      "Led the AI Stylist agent from prototype to production — now live with 50K+ users across 14+ retailers.",
    expanded:
      "Improved agent task success from 62% to 81%, not by chasing model accuracy but by reworking the interaction model around user trust — the model was often already right; the experience just hadn't earned the benefit of the doubt yet.",
  },
  {
    id: "wp-creative",
    company: "WP Creative",
    title: "Senior Technical Project Manager",
    dates: "Apr 2022 – Dec 2023",
    location: "Kathmandu, Nepal",
    excerpt:
      "Designed a drag-and-drop CMS that cut campaign setup time by 41%, then went looking for what else was slowing clients down.",
    expanded:
      "Ran 35+ customer interviews that directly informed a redesign driving a 39% lift in organic traffic and a 14% improvement in conversion — findings that came from talking to real users, not from a dashboard.",
  },
  {
    id: "hazesoft",
    company: "Hazesoft",
    title: "Associate Product Manager — Automation & Reliability",
    dates: "May 2021 – Mar 2022",
    location: "Kathmandu, Nepal",
    excerpt:
      "Reduced release time by 87% and cut manual deployment steps by 70%, turning a slow, error-prone release process into something the team could actually trust.",
    expanded:
      "Built observability systems that cut incident-detection latency by 55%, so problems surfaced before customers had to report them.",
  },
  {
    id: "bwan",
    company: "Blind Women Association of Nepal",
    title: "Web Developer & Accessibility Coordinator",
    dates: "Aug 2018 – Jan 2019",
    location: "Kathmandu, Nepal",
    excerpt:
      "Built a WCAG-compliant website so screen-reader users could navigate it independently — accessibility as the actual requirement, not an afterthought.",
    expanded:
      "Trained staff on maintaining accessible content workflows after launch, so the site stayed usable as content changed, not just on launch day.",
  },
];
