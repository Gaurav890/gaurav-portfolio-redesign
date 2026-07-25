"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { PRIMARY_NAV } from "@/lib/navigation";

/**
 * Site header: logo/name + primary nav. Collapses into a labeled disclosure
 * toggle below the `sm` breakpoint so nav never causes horizontal scroll or
 * clipped content at 390px (FR-011). Fully keyboard-operable: the toggle is
 * a real `button` with `aria-expanded`, and Escape closes the menu.
 *
 * 2026-07-25 motion-polish pass: the header picks up a soft shadow and a
 * visible bottom border once the page scrolls past the hero, instead of a
 * static flat bar the whole way down — a small "alive" touch requested
 * after feedback that the site felt static. No layout shift, no
 * reduced-motion implications (a threshold toggle, not a continuous
 * animation).
 *
 * 2026-07-25 critic-pass fix: this originally also added `backdrop-blur-md`
 * at the same threshold. An adversarial design-critic review correctly
 * flagged that against DESIGN_SYSTEM.md's own explicit anti-pattern list,
 * which names glassmorphism/excessive backdrop-blur directly - a
 * one-off blur on the nav isn't worth quietly contradicting a documented
 * design decision. Dropped in favor of a fully opaque background; the
 * shadow/border threshold alone still delivers the "alive on scroll" cue.
 */
export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 24);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-background transition-colors duration-300 ${
        isScrolled
          ? "border-border shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          : "border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg font-medium text-foreground"
          onClick={() => setIsMenuOpen(false)}
        >
          Gaurav Chaulagain
        </Link>

        <nav aria-label="Primary" className="hidden sm:block">
          <ul className="flex items-center gap-6">
            {PRIMARY_NAV.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="rounded-control border border-border px-3 py-2 text-sm font-medium text-foreground sm:hidden"
          aria-expanded={isMenuOpen}
          aria-controls={menuId}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? "Close menu" : "Menu"}
        </button>
      </div>

      {isMenuOpen && (
        <nav
          id={menuId}
          aria-label="Primary"
          className="border-t border-border px-4 py-2 sm:hidden"
        >
          <ul className="flex flex-col">
            {PRIMARY_NAV.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block py-3 text-base font-medium text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
