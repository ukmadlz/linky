import { createElement } from "react";
import { sendEmail } from "@/lib/resend";
import { PagePublishedEmail } from "@/emails/PagePublishedEmail";

export async function sendPagePublishedEmail({
  to,
  name,
  slug,
}: {
  to: string;
  name?: string;
  slug: string;
}) {
  const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`;
  await sendEmail({
    to,
    subject: "Your biohasl.ink page is live!",
    react: createElement(PagePublishedEmail, {
      name,
      pageUrl,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    }),
  });
}
