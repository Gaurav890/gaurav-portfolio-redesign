"use client";

import { Magnetic } from "@/components/motion/magnetic";
import { trackCtaClick } from "@/lib/analytics";

import { ContactActionCard } from "./contact-action-card";

type CallCtaProps = {
  isOpen: boolean;
  onOpen: () => void;
};

/**
 * "Book a call" CTA card. Purely presentational/controlled — `ContactActions`
 * owns the open/closed state so the actual Calendly embed can render as a
 * full-width block after the grid instead of inside this card (see
 * `contact-actions.tsx` for why). Kept as a uniform grid child, same shape
 * as `EmailCta`/`ResumeCta`, so the three-card row's equal-height layout
 * (`ContactActionCard`'s `h-full`) behaves correctly in every state.
 */
export function CallCta({ isOpen, onOpen }: CallCtaProps) {
  return (
    <ContactActionCard
      title="Book a call"
      description={
        isOpen
          ? "Pick a time below."
          : "Grab 20 minutes directly on the calendar."
      }
    >
      {!isOpen && (
        <Magnetic className="inline-block">
          <button
            type="button"
            onClick={() => {
              trackCtaClick("call");
              onOpen();
            }}
            className="inline-flex items-center gap-2 rounded-control border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
          >
            Open scheduler
          </button>
        </Magnetic>
      )}
    </ContactActionCard>
  );
}
