import type { EventEntry } from "@/components/events/types";

/**
 * FR-014 / OQ-014: the specific event list (past attended, future planned)
 * hasn't been provided by Gaurav yet. Ships empty per the locked
 * sparse-state decision in OPEN_QUESTIONS.md ("No — sparse state is an
 * acceptable initial launch state"). `EventsSection` already renders the
 * populated "Attended"/"Upcoming" grouped-list layout automatically the
 * moment either array below is non-empty — no component changes needed
 * when real events land, just fill in these arrays.
 */
export const ATTENDED_EVENTS: EventEntry[] = [];

export const UPCOMING_EVENTS: EventEntry[] = [];
