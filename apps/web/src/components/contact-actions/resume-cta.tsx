"use client";

import { useEffect, useRef, useState } from "react";

import { trackCtaClick } from "@/lib/analytics";

import { ContactActionCard } from "./contact-action-card";
import { RESUME_DOWNLOAD_FILENAME, RESUME_FILE_PATH } from "./constants";

type DownloadFeedback = "idle" | "downloading" | "downloaded";

const FEEDBACK_RESET_MS = 2500;

/**
 * "Resume" CTA — a real file download (`download` attribute, not just a
 * silent new tab) with visible on-page feedback, per UI_PATTERNS.md
 * "Contact action group": "Resume download triggers a real file download
 * with visible feedback."
 */
export function ResumeCta() {
  const [feedback, setFeedback] = useState<DownloadFeedback>("idle");
  const resetTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(resetTimeoutRef.current);
  }, []);

  function handleClick() {
    trackCtaClick("resume");
    setFeedback("downloading");
    window.clearTimeout(resetTimeoutRef.current);
    // The browser's native download starts synchronously on click; this
    // only sequences the on-page confirmation copy shortly after so it
    // doesn't flash faster than a screen reader can announce it.
    window.setTimeout(() => setFeedback("downloaded"), 400);
    resetTimeoutRef.current = window.setTimeout(
      () => setFeedback("idle"),
      FEEDBACK_RESET_MS,
    );
  }

  return (
    <ContactActionCard
      title="Resume"
      description="One-click PDF, no form to fill out."
    >
      <a
        href={RESUME_FILE_PATH}
        download={RESUME_DOWNLOAD_FILENAME}
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-control border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
      >
        Download resume (PDF)
      </a>
      <p aria-live="polite" className="mt-2 h-4 text-xs text-success">
        {feedback === "downloading" && "Downloading…"}
        {feedback === "downloaded" && "Resume downloaded."}
      </p>
    </ContactActionCard>
  );
}
