/**
 * Unambiguous date formatting for Notes posts (e.g. "Aug 1, 2026") — never
 * bare numeric MM/DD which UI_PATTERNS.md flags as misreadable (see the
 * "Events entry" pattern's accessibility note, which applies equally here).
 */
export function formatNoteDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
