import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { getPageBySlug, getUserById, getBlocksByPageId } from "@/lib/db/queries";
import { resolveTheme } from "@/lib/themes/resolve";
import { themeToCssVars } from "@/lib/themes/to-css-vars";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { PageHeader } from "@/components/public/PageHeader";
import { LinkyBranding } from "@/components/public/LinkyBranding";
import { PageViewTracker } from "@/components/public/PageViewTracker";
import type { ThemeConfig } from "@/lib/themes/types";

export const revalidate = 60;

interface PublicPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page || !page.isPublished) {
    return { title: "Page not found" };
  }

  const user = await getUserById(page.userId);
  const displayName = user?.name || user?.username || slug;
  const title = page.seoTitle || page.title || `${displayName} | biohasl.ink`;
  const description =
    page.seoDescription ||
    page.description ||
    `Check out ${displayName}'s page on biohasl.ink.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(page.ogImageUrl ? { images: [{ url: page.ogImageUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(page.ogImageUrl ? { images: [page.ogImageUrl] } : {}),
    },
  };
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page || !page.isPublished) {
    notFound();
  }

  const [user, blocks] = await Promise.all([
    getUserById(page.userId),
    getBlocksByPageId(page.id),
  ]);

  const theme = resolveTheme(
    page.themeId ?? "default",
    (page.themeOverrides as Partial<ThemeConfig>) ?? {}
  );
  const cssVars = themeToCssVars(theme);

  return (
    <>
      {/* Lightweight client-side page view beacon */}
      <PageViewTracker pageId={page.id} />

      <div className="linky-page" style={cssVars as CSSProperties}>
        {/* Page header: avatar, display name, bio */}
        <PageHeader
          name={user?.name ?? null}
          bio={user?.bio ?? null}
          avatarUrl={user?.avatarUrl ?? null}
          username={user?.username ?? null}
        />

        {/* Block list — each block wrapped for proper spacing */}
        <main>
          {blocks.map((block) => (
            <div key={block.id} className="block-wrapper">
              <BlockRenderer block={block} buttonStyle={theme.buttonStyle} />
            </div>
          ))}
        </main>

        {/* "Made with Linky" branding footer (free tier only) */}
        {!user?.isPro && <LinkyBranding />}
      </div>
    </>
  );
}
