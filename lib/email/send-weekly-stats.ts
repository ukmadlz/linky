import { createElement } from "react";
import { sendEmail } from "@/lib/resend";
import { WeeklyStatsEmail } from "@/emails/WeeklyStatsEmail";

export async function sendWeeklyStatsEmail({
  to,
  name,
  pageViews,
  totalClicks,
  viewsDelta,
  clicksDelta,
  topLinks,
}: {
  to: string;
  name?: string;
  pageViews: number;
  totalClicks: number;
  viewsDelta: number;
  clicksDelta: number;
  topLinks?: Array<{ title: string; clicks: number }>;
}) {
  await sendEmail({
    to,
    subject: "Your biohasl.ink weekly stats",
    react: createElement(WeeklyStatsEmail, {
      name,
      pageViews,
      totalClicks,
      viewsDelta,
      clicksDelta,
      topLinks,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    }),
  });
}
