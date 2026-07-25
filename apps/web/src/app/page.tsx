import { About } from "@/components/about/about";
import { ContactActions } from "@/components/contact-actions";
import { CredentialsSection } from "@/components/credentials/credentials-section";
import { EventsSection } from "@/components/events/events-section";
import { Experience } from "@/components/experience/experience";
import { Hero } from "@/components/hero/hero";
import { FadeIn } from "@/components/motion/fade-in";
import { ProjectsSection } from "@/components/projects/projects-section";

/**
 * Home page assembly (integration pass after T-010–T-016/T-050). Each
 * section component owns its own <section id="..."> landmark and is
 * self-contained per its own files_owned scope in TASKS.jsonl — this file
 * only orders and composes them. ContactActions is the one exception: it
 * deliberately does not render its own section wrapper (see its own
 * doc comment), so the "contact" landmark stays here, alongside a
 * placeholder for the contact form itself (T-021, not yet implemented -
 * the backend at T-020 is done, but no form UI calls it yet).
 */
export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Experience />
      <ProjectsSection />
      <EventsSection />
      <CredentialsSection />

      <FadeIn
        as="section"
        id="contact"
        aria-labelledby="contact-heading"
        className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6"
      >
        <h2
          id="contact-heading"
          className="font-display text-2xl font-medium text-foreground"
        >
          Contact
        </h2>
        <p className="mt-3 max-w-xl text-foreground-muted">
          Book a call, send an email, or grab the resume — whichever&apos;s
          easiest.
        </p>

        <div className="mt-8">
          <ContactActions />
        </div>

        {/* Contact form (T-021) lands here once built - the backend
            (/api/contact, T-020) is already implemented and tested. */}
      </FadeIn>
    </>
  );
}
