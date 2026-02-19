import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface MilestoneEmailProps {
  name?: string;
  milestone?: number;
  metric?: "views" | "clicks";
  dashboardUrl?: string;
}

export function MilestoneEmail({
  name = "there",
  milestone = 100,
  metric = "views",
  dashboardUrl = "https://biohasl.ink/dashboard",
}: MilestoneEmailProps) {
  const metricLabel = metric === "views" ? "page views" : "link clicks";
  const emoji = milestone >= 1000 ? "🎉" : "🚀";

  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>biohasl.ink</Text>
          </Section>

          <Section style={content}>
            <Text style={emoji_display}>{emoji}</Text>
            <Text style={heading}>
              You just hit {milestone.toLocaleString()} {metricLabel}!
            </Text>
            <Text style={paragraph}>
              Congratulations, {name}! Your biohasl.ink page is gaining momentum. Keep
              sharing your link to reach even more people.
            </Text>

            <Section style={buttonContainer}>
              <Button href={dashboardUrl} style={button}>
                View Your Analytics
              </Button>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              You received this email because you have a biohasl.ink page.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default MilestoneEmail;

const body: React.CSSProperties = {
  backgroundColor: "#f7f5f4",
  fontFamily: "DM Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
  textAlign: "center",
};

const emoji_display: React.CSSProperties = {
  fontSize: "48px",
  margin: "0 0 16px",
};

const heading: React.CSSProperties = {
  color: "#292d4c",
  fontSize: "26px",
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

const buttonContainer: React.CSSProperties = {
  marginTop: "24px",
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
  margin: 0,
};
