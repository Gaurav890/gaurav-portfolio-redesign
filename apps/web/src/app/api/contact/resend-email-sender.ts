// Production EmailSender implementation, backed by the real `resend` SDK.
// RESEND_API_KEY is read once by the caller (route.ts) and never logged.
// See ARCHITECTURE.md: "/api/contact <-> Resend: trusted server-to-server,
// API keys server-side only."

import type { Resend } from "resend";
import type { EmailSender, OpResult } from "./types";
import { withTimeout } from "./timeout";

const SEND_TIMEOUT_MS = 10_000;

export interface ResendEmailSenderOptions {
  /** Gaurav's notification inbox — where the contact-form email is sent. */
  to: string;
  /** Verified Resend sending address. */
  from: string;
}

export function createResendEmailSender(client: Resend, options: ResendEmailSenderOptions): EmailSender {
  return {
    async sendContactNotification({ name, email, message, submissionId }): Promise<OpResult<void>> {
      try {
        const { error } = await withTimeout(
          client.emails.send({
            to: options.to,
            from: options.from,
            replyTo: email,
            subject: `New contact form submission from ${name}`,
            text: [
              `New contact form submission (id: ${submissionId})`,
              "",
              `Name: ${name}`,
              `Email: ${email}`,
              "",
              "Message:",
              message,
            ].join("\n"),
          }),
          SEND_TIMEOUT_MS,
          "Resend send",
        );

        if (error) {
          return { ok: false, error: new Error(error.message) };
        }
        return { ok: true, value: undefined };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
  };
}
