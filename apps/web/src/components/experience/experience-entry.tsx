"use client";

import { useId, useState } from "react";

import type { ExperienceRole } from "@/components/experience/experience-data";

/**
 * A single Experience timeline entry (T-012, UI_PATTERNS.md "Experience
 * timeline entry"). Collapsed state always shows company/title/dates/
 * location plus a real narrative excerpt (never bare metadata). The
 * expand/collapse control is a real, keyboard-operable `button` with
 * `aria-expanded`/`aria-controls`, following the same pattern as
 * `SiteHeader`'s mobile-menu disclosure.
 */
export function ExperienceEntry({ role }: { role: ExperienceRole }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelId = useId();

  return (
    <li className="border-b border-border py-8 first:pt-0 last:border-b-0">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <div>
          <h3 className="font-display text-xl font-medium text-foreground sm:text-2xl">
            {role.title}
          </h3>
          <p className="mt-1 text-base text-foreground-muted">
            {role.company} · {role.location}
          </p>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.06em] text-foreground-muted sm:shrink-0 sm:text-right">
          {role.dates}
        </p>
      </div>

      <p className="mt-4 max-w-[68ch] text-base leading-relaxed text-foreground sm:text-lg">
        {role.excerpt}
      </p>

      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={() => setIsExpanded((expanded) => !expanded)}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-secondary transition-colors hover:text-accent"
      >
        {isExpanded ? "Read less" : "Read more"}
        <span aria-hidden="true" className={isExpanded ? "rotate-180" : ""}>
          ↓
        </span>
      </button>

      {isExpanded && (
        <p
          id={panelId}
          className="mt-3 max-w-[68ch] text-base leading-relaxed text-foreground-muted sm:text-lg"
        >
          {role.expanded}
        </p>
      )}
    </li>
  );
}
