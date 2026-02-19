import {
	Body,
	Button,
	Container,
	Head,
	Hr,
	Html,
	Section,
	Text,
} from "@react-email/components";
import type * as React from "react";

interface PagePublishedEmailProps {
	name?: string;
	pageUrl?: string;
	dashboardUrl?: string;
}

export function PagePublishedEmail({
	name = "there",
	pageUrl = "https://biohasl.ink/username",
	dashboardUrl = "https://biohasl.ink/dashboard",
}: PagePublishedEmailProps) {
	return (
		<Html>
			<Head />
			<Body style={body}>
				<Container style={container}>
					<Section style={header}>
						<Text style={logo}>biohasl.ink</Text>
					</Section>

					<Section style={content}>
						<Text style={heading}>Your page is live! 🎉</Text>
						<Text style={paragraph}>
							Congratulations, {name}! Your biohasl.ink page is now published
							and ready to share with the world.
						</Text>

						<Section style={urlBox}>
							<Text style={urlLabel}>Your public URL</Text>
							<Text style={urlText}>{pageUrl}</Text>
						</Section>

						<Text style={tipsHeading}>Share your link:</Text>
						<Text style={tip}>
							📸 <strong>Instagram</strong> — Add it to your bio in Profile
							Settings → Edit Profile → Website
						</Text>
						<Text style={tip}>
							🐦 <strong>Twitter/X</strong> — Add it to your profile bio or
							pinned tweet
						</Text>
						<Text style={tip}>
							💼 <strong>LinkedIn</strong> — Add it to your profile contact info
						</Text>

						<Section style={buttonContainer}>
							<Button href={pageUrl} style={primaryButton}>
								View Your Page
							</Button>
							<Button href={dashboardUrl} style={secondaryButton}>
								Back to Dashboard
							</Button>
						</Section>
					</Section>

					<Hr style={divider} />

					<Section style={footer}>
						<Text style={footerText}>
							You received this email because you published your biohasl.ink
							page.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

export default PagePublishedEmail;

const body: React.CSSProperties = {
	backgroundColor: "#f7f5f4",
	fontFamily:
		"DM Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
	margin: 0,
	padding: 0,
};

const container: React.CSSProperties = {
	backgroundColor: "#ffffff",
	borderRadius: "8px",
	margin: "40px auto",
	maxWidth: "560px",
	overflow: "hidden",
};

const header: React.CSSProperties = {
	backgroundColor: "#5f4dc5",
	padding: "24px 32px",
};

const logo: React.CSSProperties = {
	color: "#ffffff",
	fontSize: "24px",
	fontWeight: "700",
	letterSpacing: "-0.5px",
	margin: 0,
};

const content: React.CSSProperties = {
	padding: "32px",
};

const heading: React.CSSProperties = {
	color: "#292d4c",
	fontSize: "24px",
	fontWeight: "700",
	lineHeight: "1.3",
	margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
	color: "#67697f",
	fontSize: "16px",
	lineHeight: "1.6",
	margin: "0 0 24px",
};

const urlBox: React.CSSProperties = {
	backgroundColor: "#f7f5f4",
	borderRadius: "8px",
	marginBottom: "24px",
	padding: "16px",
};

const urlLabel: React.CSSProperties = {
	color: "#67697f",
	fontSize: "12px",
	fontWeight: "600",
	letterSpacing: "0.05em",
	margin: "0 0 4px",
	textTransform: "uppercase",
};

const urlText: React.CSSProperties = {
	color: "#5f4dc5",
	fontSize: "16px",
	fontWeight: "600",
	margin: 0,
};

const tipsHeading: React.CSSProperties = {
	color: "#292d4c",
	fontSize: "16px",
	fontWeight: "600",
	margin: "0 0 12px",
};

const tip: React.CSSProperties = {
	color: "#292d4c",
	fontSize: "15px",
	lineHeight: "1.6",
	margin: "0 0 8px",
};

const buttonContainer: React.CSSProperties = {
	display: "flex",
	gap: "12px",
	marginTop: "32px",
};

const primaryButton: React.CSSProperties = {
	backgroundColor: "#5f4dc5",
	borderRadius: "8px",
	color: "#ffffff",
	display: "inline-block",
	fontSize: "16px",
	fontWeight: "600",
	padding: "14px 24px",
	textDecoration: "none",
};

const secondaryButton: React.CSSProperties = {
	backgroundColor: "transparent",
	border: "2px solid #5f4dc5",
	borderRadius: "8px",
	color: "#5f4dc5",
	display: "inline-block",
	fontSize: "16px",
	fontWeight: "600",
	padding: "12px 24px",
	textDecoration: "none",
};

const divider: React.CSSProperties = {
	borderColor: "#e8e8e8",
	borderTopWidth: "1px",
	margin: "0 32px",
};

const footer: React.CSSProperties = {
	padding: "24px 32px",
};

const footerText: React.CSSProperties = {
	color: "#9ca3af",
	fontSize: "13px",
	lineHeight: "1.5",
	margin: 0,
};
