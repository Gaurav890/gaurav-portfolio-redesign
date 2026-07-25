const CURRENT_YEAR = new Date().getFullYear();

/**
 * Base footer landmark. Contact CTAs (Calendly/email/resume, FR-002) land
 * here in a later task (T-016) — this is just the semantic shell.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1200px] px-4 py-8 text-sm text-foreground-muted sm:px-6">
        <p>&copy; {CURRENT_YEAR} Gaurav Chaulagain.</p>
      </div>
    </footer>
  );
}
