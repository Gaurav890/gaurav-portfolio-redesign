/**
 * Defined placeholder treatment for the "missing image" state (PRD.md §9
 * Projects row, and the Project card pattern's "missing image" state) —
 * none of the six projects have real photography yet, so every card uses
 * this monogram tile deliberately, rather than a broken-image icon or a
 * blank gap. Purely decorative: the project name is already real text
 * elsewhere in the card, so this is `aria-hidden`.
 */
export function ProjectThumbnail({ name }: { name: string }) {
  const initials = getInitials(name);

  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-border bg-accent-secondary/10 font-mono text-sm font-medium text-accent-secondary transition-transform duration-200 ease-out group-hover:scale-110"
    >
      {initials}
    </div>
  );
}

function getInitials(name: string): string {
  const words = name.match(/[A-Za-z0-9]+/g) ?? [];
  const [first, second] = words;
  if (!first) return "?";
  if (!second) return first.slice(0, 2).toUpperCase();
  return (first[0] + second[0]).toUpperCase();
}
