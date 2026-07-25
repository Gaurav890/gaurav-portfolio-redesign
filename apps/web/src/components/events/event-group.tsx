import type { EventEntry } from "@/components/events/types";

const FORMAT_LABEL: Record<EventEntry["format"], string> = {
  "in-person": "In person",
  virtual: "Virtual",
  hybrid: "Hybrid",
};

/**
 * One "Attended" or "Upcoming" grouping per the Events entry pattern in
 * UI_PATTERNS.md — visually lighter-weight than Project cards or Experience
 * entries (hairline dividers, no card border/shadow) since this section
 * supports the narrative rather than competing with Projects/Experience for
 * primary attention.
 */
export function EventGroup({
  title,
  events,
  emptyLabel,
}: {
  title: string;
  events: EventEntry[];
  emptyLabel: string;
}) {
  const headingId = `events-group-${title.toLowerCase()}`;

  return (
    <section aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="font-mono text-xs font-medium uppercase tracking-wide text-foreground-muted"
      >
        {title}
      </h3>

      {events.length === 0 ? (
        <p className="mt-3 text-sm text-foreground-muted">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {events.map((event) => (
            <li key={`${event.name}-${event.isoDate}`} className="py-3 first:pt-0">
              <p className="font-display text-base font-medium text-foreground">
                {event.name}
              </p>
              <p className="mt-1 font-mono text-xs text-foreground-muted">
                <time dateTime={event.isoDate}>{event.dateLabel}</time>
                {" · "}
                {event.location}
                {" · "}
                {FORMAT_LABEL[event.format]}
              </p>
              {event.note ? (
                <p className="mt-1 text-sm text-foreground-muted">{event.note}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
