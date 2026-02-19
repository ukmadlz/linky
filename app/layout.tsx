import type { Metadata } from "next";
import { DM_Sans, Playfair_Display, Fragment_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
});

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-fragment-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Linky — Your Link in Bio",
    template: "%s | Linky",
  },
  description:
    "Create a beautiful link-in-bio page with embeds, integrations, and full theming. Share everything in one link.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${playfair.variable} ${fragmentMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
