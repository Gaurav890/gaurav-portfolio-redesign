// Graceful wrap-up copy for AC-016: "Session cap triggers a graceful
// wrap-up, not a silent cutoff." Deliberately a deterministic template, not
// LLM-generated, for the *hard*-cap case: this is the one guaranteed-
// correct message a launch-critical UX requirement depends on ("never an
// abrupt cutoff"), so it should not depend on the model choosing to comply
// with a system-prompt instruction on a turn where it's already being
// cut off. The *soft* steer (session-cap.ts's softSteerActive) is still
// genuinely LLM-authored, in-character, and varies turn to turn — this
// template is only used once the hard cap has actually been reached.
//
// Contact CTA details are imported from the real contact-actions constants
// module (never hand-copied) so this message can't go stale independently
// of the actual Contact section — same discipline as
// lib/agent/knowledge-base/content.ts's "contact-ctas" chunk.

import {
  CALENDLY_URL,
  CONTACT_EMAIL,
} from "@/components/contact-actions/constants";
import type { CapHitReason } from "./session-cap";

const CONTACT_LINE = `Book a call (${CALENDLY_URL}), send an email (${CONTACT_EMAIL}), or grab the resume from the Contact section.`;

const DURATION_WRAPUP = `This has been genuinely fun — I could keep going, but I'm right at my time limit for this conversation. If you want to keep the conversation going, here's the best way: ${CONTACT_LINE}`;

const TURN_COUNT_WRAPUP = `We've covered a lot of ground here, and I'm at my limit for one sitting. Let's take this somewhere more useful than a chat window: ${CONTACT_LINE}`;

const ESCALATION_WRAPUP = `I think we've had our fun testing my limits — I'm going to wrap up here rather than keep going in circles. If you want to actually talk shop, the door's open: ${CONTACT_LINE}`;

export function buildWrapUpMessage(reason: CapHitReason): string {
  switch (reason) {
    case "duration":
      return DURATION_WRAPUP;
    case "turn_count":
      return TURN_COUNT_WRAPUP;
    case "guardrail_escalation":
      return ESCALATION_WRAPUP;
    default:
      return DURATION_WRAPUP;
  }
}
