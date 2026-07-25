import { FadeIn } from "@/components/motion/fade-in";
import { EventGroup } from "@/components/events/event-group";
import { EventsEmptyState } from "@/components/events/events-empty-state";
import { ATTENDED_EVENTS, UPCOMING_EVENTS } from "@/components/events/events-data";

/**
 * Events section (T-014, FR-014). Self-contained: owns its own
 * `<section id="events">` landmark, matching the placeholder shape it
 * replaces in `app/page.tsx` (wired in by the orchestrator — see the
 * file-ownership note on T-014).
 *
 * Ships in the intentional sparse/empty launch state per OQ-014 (no event
 * list from Gaurav yet) — but is fully data-driven, so populating
 * `events-data.ts` later switches it to the grouped "Attended"/"Upcoming"
 * layout with no further component changes.
 */
export function EventsSection() {
  const hasEvents = ATTENDED_EVENTS.length > 0 || UPCOMING_EVENTS.length > 0;

  return (
    <FadeIn
      as="section"
      id="events"
      aria-labelledby="events-heading"
      className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6 sm:py-24"
    >
      <header className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-wide text-foreground-muted">
          Events
        </p>
        <h2
          id="events-heading"
          className="mt-2 font-display text-2xl font-medium text-foreground sm:text-3xl"
        >
          On the ground
        </h2>
        <p className="mt-3 text-foreground-muted">
          Hackathons, conferences, and meetups — where I&apos;ve been and
          where I&apos;m headed next.
        </p>
      </header>

      <div className="mt-10">
        {hasEvents ? (
          <div className="grid gap-10 sm:grid-cols-2">
            <EventGroup
              title="Attended"
              events={ATTENDED_EVENTS}
              emptyLabel="No past events listed yet."
            />
            <EventGroup
              title="Upcoming"
              events={UPCOMING_EVENTS}
              emptyLabel="Nothing on the calendar yet."
            />
          </div>
        ) : (
          <EventsEmptyState />
        )}
      </div>
    </FadeIn>
  );
}
