type ContactActionCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

/**
 * Shared card shell so the three contact CTAs (Calendly, email, resume)
 * read as one equally-weighted group per DESIGN_SYSTEM.md "Interaction":
 * "The three contact CTAs ... share equal visual weight as a group." None
 * of the three uses a solid-accent primary-button fill — that treatment is
 * reserved for the voice agent's single signature entry point, per the same
 * section, so this group stays visually secondary to it by construction.
 */
export function ContactActionCard({
  title,
  description,
  children,
}: ContactActionCardProps) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-card border border-border bg-background-raised p-6">
      <div>
        <h3 className="font-display text-lg font-medium text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-sm text-foreground-muted">{description}</p>
      </div>
      <div className="mt-auto pt-2">{children}</div>
    </div>
  );
}
