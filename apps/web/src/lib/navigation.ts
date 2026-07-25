/**
 * Primary site navigation, per the IA in docs/10-product/PRD.md section 7.
 *
 * "Projects" and "Events" are homepage sections (owned by T-013/T-014 as
 * components rendered on `/`, not standalone routes — see
 * docs/40-execution/TASKS.jsonl files_owned), so they link to in-page
 * anchors. "Notes" is a standalone route (owned by T-017 at
 * apps/web/app/notes/**), matching FR-015's list+detail IA.
 */
export type NavLink = {
  label: string;
  href: string;
};

export const PRIMARY_NAV: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/#projects" },
  { label: "Notes", href: "/notes" },
  { label: "Events", href: "/#events" },
  { label: "Contact", href: "/#contact" },
];
