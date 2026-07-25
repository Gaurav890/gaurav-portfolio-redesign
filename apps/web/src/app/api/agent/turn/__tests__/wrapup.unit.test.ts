import { describe, expect, it } from "vitest";
import { CALENDLY_URL, CONTACT_EMAIL } from "@/components/contact-actions/constants";
import { buildWrapUpMessage } from "../lib/wrapup";

describe("buildWrapUpMessage", () => {
  it.each(["duration", "turn_count", "guardrail_escalation"] as const)(
    "always surfaces all three contact CTAs for reason=%s (AC-016)",
    (reason) => {
      const message = buildWrapUpMessage(reason);
      expect(message).toContain(CALENDLY_URL);
      expect(message).toContain(CONTACT_EMAIL);
      expect(message.toLowerCase()).toContain("resume");
    },
  );

  it("is warm, not abrupt — never a bare cutoff notice", () => {
    for (const reason of ["duration", "turn_count", "guardrail_escalation"] as const) {
      const message = buildWrapUpMessage(reason);
      expect(message.length).toBeGreaterThan(60);
      expect(message).not.toMatch(/^(session ended|error|cap hit)/i);
    }
  });

  it("uses distinct copy per reason", () => {
    const duration = buildWrapUpMessage("duration");
    const turnCount = buildWrapUpMessage("turn_count");
    const escalation = buildWrapUpMessage("guardrail_escalation");
    expect(new Set([duration, turnCount, escalation]).size).toBe(3);
  });
});
