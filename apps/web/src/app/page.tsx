import { FadeIn } from "@/components/motion/fade-in";

/**
 * Bare-bones home page shell (T-001). Each section below is a placeholder
 * landing spot for later content tasks — do not add real hero/about/
 * experience/projects/events/contact content here (T-010 through T-016).
 */
export default function Home() {
  return (
    <>
      {/* Hero placeholder — rendered plain (no client animation) so core
          identity content stays in server-rendered HTML with no JS
          dependency, per FR-001/AC-010. Built out in T-010. */}
      <section
        id="hero"
        aria-labelledby="hero-heading"
        className="mx-auto max-w-[1100px] px-4 py-24 sm:px-6"
      >
        <p className="font-mono text-xs uppercase tracking-wide text-foreground-muted">
          Portfolio — under construction
        </p>
        <h1
          id="hero-heading"
          className="mt-4 max-w-2xl font-display text-4xl font-medium leading-tight text-foreground sm:text-5xl"
        >
          Gaurav Chaulagain
        </h1>
        <p className="mt-4 max-w-xl text-lg text-foreground-muted">
          Hero content, role framing, and credibility stats land here in
          T-010.
        </p>
      </section>

      <FadeIn
        as="section"
        id="about"
        aria-labelledby="about-heading"
        className="mx-auto max-w-[680px] px-4 py-16 sm:px-6"
      >
        <h2
          id="about-heading"
          className="font-display text-2xl font-medium text-foreground"
        >
          About
        </h2>
        <p className="mt-3 text-foreground-muted">
          Narrative About section lands here in T-011.
        </p>
      </FadeIn>

      <FadeIn
        as="section"
        id="experience"
        aria-labelledby="experience-heading"
        className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6"
      >
        <h2
          id="experience-heading"
          className="font-display text-2xl font-medium text-foreground"
        >
          Experience
        </h2>
        <p className="mt-3 text-foreground-muted">
          Experience timeline lands here in T-012.
        </p>
      </FadeIn>

      <FadeIn
        as="section"
        id="projects"
        aria-labelledby="projects-heading"
        className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6"
      >
        <h2
          id="projects-heading"
          className="font-display text-2xl font-medium text-foreground"
        >
          Featured projects
        </h2>
        <p className="mt-3 text-foreground-muted">
          Six featured projects (ELDA.AI, Aakha.org, NepalElection.chat,
          vocal-stack, AquaOracle, Dr. Birkhe) land here in T-013.
        </p>
      </FadeIn>

      <FadeIn
        as="section"
        id="events"
        aria-labelledby="events-heading"
        className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6"
      >
        <h2
          id="events-heading"
          className="font-display text-2xl font-medium text-foreground"
        >
          Events
        </h2>
        <p className="mt-3 text-foreground-muted">
          Attended/upcoming events land here in T-014.
        </p>
      </FadeIn>

      <FadeIn
        as="section"
        id="credentials"
        aria-labelledby="credentials-heading"
        className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6"
      >
        <h2
          id="credentials-heading"
          className="font-display text-2xl font-medium text-foreground"
        >
          Education, achievements &amp; community
        </h2>
        <p className="mt-3 text-foreground-muted">
          Education/achievements/community content lands here in T-015.
        </p>
      </FadeIn>

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
        <p className="mt-3 text-foreground-muted">
          Contact CTAs (Calendly/email/resume) and the contact form land here
          in T-016/T-020/T-021.
        </p>
      </FadeIn>
    </>
  );
}
