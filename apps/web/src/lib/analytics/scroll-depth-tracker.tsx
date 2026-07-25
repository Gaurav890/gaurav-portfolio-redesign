"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { trackSectionView } from "./track";

/**
 * Fires a `section_view` scroll-depth milestone the first time each
 * semantic `<section id="...">` landmark enters the viewport (FR-012).
 *
 * Mounted once, globally, via `AnalyticsProvider` in the root layout.
 * Deliberately DOM-driven (queries `main section[id]` directly) rather than
 * requiring every section component to call a hook individually — Hero,
 * About, Experience, Projects, Events, and Contact are built by separate
 * parallel tasks (T-010 through T-016) that this task doesn't own, so
 * coupling to their internals would create unnecessary cross-task
 * dependencies. This only relies on the `<section id="...">` landmark
 * convention the app shell already establishes (DESIGN_SYSTEM.md
 * "Accessibility" — semantic landmarks throughout) and re-scans on route
 * change, so it keeps working as those sections are filled in.
 */
export function ScrollDepthTracker() {
  const seenSectionIds = useRef(new Set<string>());
  const pathname = usePathname();

  // Re-scans on pathname change (e.g. `/` -> `/notes`) so navigating to a
  // route with its own section landmarks keeps working, not just the
  // sections present at first mount.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(
      "main section[id]",
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          if (!id || seenSectionIds.current.has(id)) continue;
          seenSectionIds.current.add(id);
          trackSectionView(id);
        }
      },
      { threshold: 0.5 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
