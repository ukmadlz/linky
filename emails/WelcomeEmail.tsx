import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Img,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  name?: string;
  dashboardUrl?: string;
}

export function WelcomeEmail({
  name = "there",
  dashboardUrl = "https://biohasl.ink/dashboard",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>biohasl.ink</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Welcome to biohasl.ink, {name}!</Text>
            <Text style={paragraph}>
              You&apos;re all set! Your link-in-bio page is ready to customize.
              Here&apos;s how to get started:
            </Text>

            <Text style={step}>
              <strong>1. Add your links</strong> — Share everything in one
              place: YouTube videos, Spotify playlists, your website, and more.
            </Text>
            <Text style={step}>
              <strong>2. Customize your theme</strong> — Choose from beautiful
              presets or create your own look with custom colors and fonts.
            </Text>
            <Text style={step}>
              <strong>3. Share your page</strong> — Add your unique biohasl.ink URL to
              your Instagram bio, Twitter profile, or anywhere online.
            </Text>

            <Section style={buttonContainer}>
              <Button href={dashboardUrl} style={button}>
                Go to Dashboard
              </Button>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              You received this email because you signed up for biohasl.ink.
            </Text>
            <Text style={footerText}>biohasl.ink · Your bio, inked.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

// Styles
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

const step: React.CSSProperties = {
  color: "#292d4c",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
  paddingLeft: "0",
};

const buttonContainer: React.CSSProperties = {
  marginTop: "32px",
  textAlign: "center",
};

const button: React.CSSProperties = {
  backgroundColor: "#5f4dc5",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "14px 32px",
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
  margin: "0 0 4px",
};
