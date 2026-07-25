export type EventFormat = "in-person" | "virtual" | "hybrid";

export type EventEntry = {
  /** Event name (e.g. "Cal Hacks 12.0"). */
  name: string;
  /**
   * Human-readable, unambiguous date label — spelled-out month, never
   * solely numeric MM/DD (Events entry pattern accessibility note, since
   * bare numeric dates can be misread across locales).
   */
  dateLabel: string;
  /** ISO 8601 date for the `<time dateTime>` machine-readable value. */
  isoDate: string;
  location: string;
  format: EventFormat;
  /** Optional one-line note, e.g. "Won Best Use of Claude." */
  note?: string;
};
