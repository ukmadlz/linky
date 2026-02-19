import { Resend } from "resend";
import type { ReactElement } from "react";

let _client: Resend | null = null;

function getResendClient(): Resend {
  if (_client) return _client;
  _client = new Resend(process.env.RESEND_API_KEY);
  return _client;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL ?? "biohasl.ink <noreply@biohasl.ink>";

  // Fire-and-forget: errors are caught and logged without blocking the request
  try {
    await resend.emails.send({ from, to, subject, react });
  } catch (error) {
    console.error("[Resend] Failed to send email:", error);
  }
}
