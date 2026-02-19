import { createElement } from "react";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { sendEmail } from "@/lib/resend";

export async function sendWelcomeEmail({
	to,
	name,
}: {
	to: string;
	name?: string;
}) {
	await sendEmail({
		to,
		subject: "Welcome to biohasl.ink!",
		react: createElement(WelcomeEmail, {
			name,
			dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
		}),
	});
}
