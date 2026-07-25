"use client";

import { useState } from "react";

import { FadeIn } from "@/components/motion/fade-in";

import { CalendlyEmbed } from "./calendly-embed";
import { CallCta } from "./call-cta";
import { EmailCta } from "./email-cta";
import { ResumeCta } from "./resume-cta";

/**
 * The three equally-weighted contact CTAs (FR-002, FR-004; T-016): book a
 * call (Calendly, click-to-open embed with fallback), email (mailto), and
 * resume download. Presented as one clear group in an equal-width grid
 * (single column on mobile) per UI_PATTERNS.md "Contact action group."
 *
 * The "open scheduler" state lives here (not inside `CallCta`) so the
 * Calendly embed renders as a full-width block *after* the grid rather than
 * nested inside one grid cell. An earlier version nested it inside a
 * dynamically `col-span-3` grid item, which combined with `ContactActionCard`'s
 * `h-full` (used for equal-height cards at rest) into a genuine CSS bug:
 * under the grid's default `align-items: stretch`, the wrapping item's
 * height became circularly self-referential (child at 100% height of a
 * parent whose own height depends on that same child's content), and the
 * embed visually overlapped the Email/Resume row instead of pushing it
 * down. Keeping all three cards as plain, uniform grid children and moving
 * the expanded embed outside the grid entirely avoids that class of bug by
 * construction, and reads better besides — the embed gets the full section
 * width instead of being squeezed into a 3-column cell.
 *
 * Self-contained and orchestration-agnostic: doesn't render its own section
 * heading/landmark, so it can be dropped into the existing Contact section
 * in `apps/web/src/app/page.tsx` (owned by other in-flight work) without
 * further plumbing — just `<ContactActions />` inside that section.
 *
 * Deliberately NOT the contact form (name/email/message + backend) — that's
 * T-020/T-021, a separate task per `docs/40-execution/TASKS.jsonl` file
 * ownership. The form is expected to render alongside this group, not
 * inside it.
 */
export function ContactActions() {
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CallCta
          isOpen={isSchedulerOpen}
          onOpen={() => setIsSchedulerOpen(true)}
        />
        <EmailCta />
        <ResumeCta />
      </div>

      {isSchedulerOpen && (
        <FadeIn className="mt-4">
          <CalendlyEmbed />
        </FadeIn>
      )}
    </div>
  );
}
