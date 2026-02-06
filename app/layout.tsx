import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linky - Self-Hosted Link in Bio",
  description: "A self-hosted Linktree alternative",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
