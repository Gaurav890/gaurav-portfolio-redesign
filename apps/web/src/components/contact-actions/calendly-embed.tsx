"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { trackCtaClick } from "@/lib/analytics";

import { CALENDLY_URL } from "./constants";

const WIDGET_MOUNT_TIMEOUT_MS = 6000;

type EmbedStatus = "loading" | "ready" | "failed";

/**
 * Calendly inline embed with an explicit fallback link — never a blank
 * iframe box (PRD §9 Hero/page-load row: "Failed embed (Calendly) shows
 * fallback link"; UI_PATTERNS.md "Contact action group": "the Calendly
 * embed has an explicit fallback state if it fails to load (direct link,
 * not a blank iframe box)").
 *
 * Calendly's `widget.js` doesn't fire a catchable error when blocked by an
 * ad blocker, a restrictive CSP, or a slow/broken network — it just never
 * injects its iframe. The only reliable failure signal is "did an iframe
 * appear in the container within a reasonable window," so this component
 * watches for that with a `MutationObserver` + timeout rather than relying
 * on `<script onError>` alone (kept as a secondary, faster signal for the
 * case where the script file itself 404s or is blocked outright).
 */
export function CalendlyEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<EmbedStatus>("loading");
  const hasTrackedOpen = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let settled = false;

    const observer = new MutationObserver(() => {
      if (settled || !container.querySelector("iframe")) return;
      settled = true;
      setStatus("ready");
      observer.disconnect();
    });
    observer.observe(container, { childList: true, subtree: true });

    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      setStatus("failed");
    }, WIDGET_MOUNT_TIMEOUT_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div data-testid="calendly-embed">
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onError={() => setStatus("failed")}
      />

      {status !== "failed" && (
        <div
          ref={containerRef}
          className="calendly-inline-widget min-h-[420px] w-full overflow-hidden rounded-card border border-border"
          data-url={CALENDLY_URL}
          aria-busy={status === "loading"}
          onClickCapture={() => {
            if (hasTrackedOpen.current) return;
            hasTrackedOpen.current = true;
            trackCtaClick("call");
          }}
        >
          {status === "loading" && (
            <p className="flex h-[420px] items-center justify-center px-6 text-center text-sm text-foreground-muted">
              Loading the scheduler&hellip;
            </p>
          )}
        </div>
      )}

      {status === "failed" && (
        <div className="rounded-card border border-border bg-background-raised p-6">
          <p className="text-sm text-foreground-muted">
            The embedded scheduler didn&rsquo;t load — this can happen behind
            an ad blocker or a restrictive network. Use the direct link
            instead:
          </p>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex items-center gap-1 font-medium text-accent hover:text-accent-secondary"
            onClick={() => trackCtaClick("call")}
          >
            Open scheduling page &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
