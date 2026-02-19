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

interface WeeklyStatsEmailProps {
  name?: string;
  pageViews?: number;
  totalClicks?: number;
  viewsDelta?: number;
  clicksDelta?: number;
  topLinks?: Array<{ title: string; clicks: number }>;
  dashboardUrl?: string;
}

export function WeeklyStatsEmail({
  name = "there",
  pageViews = 0,
  totalClicks = 0,
  viewsDelta = 0,
  clicksDelta = 0,
  topLinks = [],
  dashboardUrl = "https://biohasl.ink/dashboard",
}: WeeklyStatsEmailProps) {
  const formatDelta = (delta: number) => {
    if (delta > 0) return `↑ ${delta} from last week`;
    if (delta < 0) return `↓ ${Math.abs(delta)} from last week`;
    return "Same as last week";
  };

  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>biohasl.ink</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Your weekly stats, {name}</Text>
            <Text style={subheading}>Here&apos;s how your page performed this week:</Text>

            <Section style={statsGrid}>
              <Section style={statCard}>
                <Text style={statNumber}>{pageViews.toLocaleString()}</Text>
                <Text style={statLabel}>Page Views</Text>
                <Text style={statDelta(viewsDelta)}>{formatDelta(viewsDelta)}</Text>
              </Section>
              <Section style={statCard}>
                <Text style={statNumber}>{totalClicks.toLocaleString()}</Text>
                <Text style={statLabel}>Link Clicks</Text>
                <Text style={statDelta(clicksDelta)}>{formatDelta(clicksDelta)}</Text>
              </Section>
            </Section>

            {topLinks.length > 0 && (
              <>
                <Text style={sectionTitle}>Top clicked links</Text>
                {topLinks.slice(0, 3).map((link, i) => (
                  <Section key={i} style={linkRow}>
                    <Text style={linkTitle}>{link.title}</Text>
                    <Text style={linkClicks}>{link.clicks} clicks</Text>
                  </Section>
                ))}
              </>
            )}

            <Section style={buttonContainer}>
              <Button href={dashboardUrl} style={button}>
                View Full Analytics
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

export default WeeklyStatsEmail;

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
};

const heading: React.CSSProperties = {
  color: "#292d4c",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 8px",
};

const subheading: React.CSSProperties = {
  color: "#67697f",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const statsGrid: React.CSSProperties = {
  display: "flex",
  gap: "16px",
  marginBottom: "24px",
};

const statCard: React.CSSProperties = {
  backgroundColor: "#f7f5f4",
  borderRadius: "8px",
  flex: 1,
  padding: "16px",
};

const statNumber: React.CSSProperties = {
  color: "#292d4c",
  fontSize: "32px",
  fontWeight: "700",
  margin: "0 0 4px",
};

const statLabel: React.CSSProperties = {
  color: "#67697f",
  fontSize: "14px",
  margin: "0 0 8px",
};

const statDelta = (delta: number): React.CSSProperties => ({
  color: delta >= 0 ? "#00c245" : "#ef4444",
  fontSize: "13px",
  margin: 0,
});

const sectionTitle: React.CSSProperties = {
  color: "#292d4c",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const linkRow: React.CSSProperties = {
  borderBottom: "1px solid #f0f0f0",
  display: "flex",
  justifyContent: "space-between",
  paddingBottom: "8px",
  marginBottom: "8px",
};

const linkTitle: React.CSSProperties = {
  color: "#292d4c",
  fontSize: "14px",
  margin: 0,
};

const linkClicks: React.CSSProperties = {
  color: "#67697f",
  fontSize: "14px",
  margin: 0,
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
  margin: 0,
};
