"use client";

import { useEffect, useRef } from "react";

/**
 * Progressive-enhancement layer for the About section's native
 * `<details>/<summary>` "Continue reading" disclosure (about.tsx).
 *
 * `<summary>` is a real, natively keyboard-operable, non-`div` interactive
 * element (confirmed via Playwright: it is a genuine tab stop with
 * `tabIndex === 0`, and the open/close interaction requires zero
 * JavaScript). But empirically — verified in Chromium via Playwright's
 * accessibility snapshot, not assumed from spec text — it is exposed with
 * accessibility role "generic" rather than "button", and browsers do not
 * automatically keep `aria-expanded` in sync with the parent `<details>`
 * element's `open` state. Both gaps are fixed here explicitly:
 *   - `role="button"` is set directly in the JSX in about.tsx (works
 *     without any JS, since it's a static HTML attribute).
 *   - `aria-expanded` is kept in sync with the native `open` state by this
 *     component, using the details element's native `toggle` event.
 *
 * If JS never loads, the summary is still a focusable, natively
 * operable disclosure control (per the tabIndex/keyboard behavior above)
 * — it just won't announce its expanded/collapsed state to assistive
 * tech, which is a real but bounded degradation, not a broken control.
 */
export function AboutExpandA11y() {
  const observedRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    const details = document.getElementById("about-expand") as HTMLDetailsElement | null;
    const summary = details?.querySelector("summary");
    if (!details || !summary) return;

    observedRef.current = details;

    const syncExpandedState = () => {
      summary.setAttribute("aria-expanded", String(details.open));
    };

    syncExpandedState();
    details.addEventListener("toggle", syncExpandedState);
    return () => details.removeEventListener("toggle", syncExpandedState);
  }, []);

  return null;
}
