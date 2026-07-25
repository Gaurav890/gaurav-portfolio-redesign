export type ProjectLink = {
  href: string;
  label: string;
};

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  problem: string;
  approach: string;
  outcome: string;
  /** Tech-stack tags, rendered in the monospace "label" style. Empty when
   *  the project intentionally ships in the sparse content state. */
  tech: string[];
  /** Short badge copy for a notable win (e.g. a hackathon award). */
  highlight?: string;
  /** External links (GitHub, npm, live site) — zero or more per the
   *  Project card pattern's "where one exists" behavior. */
  links: ProjectLink[];
  /**
   * True when this project intentionally ships with reduced detail per
   * PRD.md section 13's "sparse" edge case (a content-completion gap, not a
   * bug) — renders a labeled "more detail coming soon" note instead of a
   * broken-looking blank tech/link area. See OQ-013 in OPEN_QUESTIONS.md.
   */
  sparse?: boolean;
};
