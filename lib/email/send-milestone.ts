import { createElement } from "react";
import { MilestoneEmail } from "@/emails/MilestoneEmail";
import { sendEmail } from "@/lib/resend";

export async function sendMilestoneEmail({
	to,
	name,
	milestone,
	metric,
}: {
	to: string;
	name?: string;
	milestone: number;
	metric: "views" | "clicks";
}) {
	const metricLabel = metric === "views" ? "page views" : "link clicks";
	await sendEmail({
		to,
		subject: `You just hit ${milestone.toLocaleString()} ${metricLabel}! 🎉`,
		react: createElement(MilestoneEmail, {
			name,
			milestone,
			metric,
			dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
		}),
	});
}
