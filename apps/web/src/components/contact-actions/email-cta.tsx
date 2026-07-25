"use client";

import { trackCtaClick } from "@/lib/analytics";

import { ContactActionCard } from "./contact-action-card";
import { CONTACT_EMAIL } from "./constants";

/** "Email" CTA — a plain `mailto:` link with a clear, descriptive label. */
export function EmailCta() {
  return (
    <ContactActionCard
      title="Email"
      description="Prefer writing? Send a direct email."
    >
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        onClick={() => trackCtaClick("email")}
        className="inline-flex items-center gap-2 break-all rounded-control border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
      >
        {CONTACT_EMAIL}
      </a>
    </ContactActionCard>
  );
}
