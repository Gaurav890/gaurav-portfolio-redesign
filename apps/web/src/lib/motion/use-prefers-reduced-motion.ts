"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const mediaQueryList = window.matchMedia(QUERY);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  // Server-rendered markup can't know the client's OS-level preference, so
  // assume motion is allowed and let the client re-render once mounted. This
  // never blocks core content (NFR-001) and only affects entrance animation.
  return false;
}

/**
 * Respect `prefers-reduced-motion` (DESIGN_SYSTEM.md "Motion", AC-009).
 *
 * Every animated component in this app should call this hook and either
 * skip its animation or collapse it to an instant/opacity-only transition
 * when it returns `true` — never build a one-off animation that ignores it.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
