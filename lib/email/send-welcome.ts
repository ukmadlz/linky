import { createElement } from "react";
import { sendEmail } from "@/lib/resend";
import { WelcomeEmail } from "@/emails/WelcomeEmail";

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name?: string;
}) {
  await sendEmail({
    to,
    subject: "Welcome to Linky! 🎉",
    react: createElement(WelcomeEmail, {
      name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    }),
  });
}
