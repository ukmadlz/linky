import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { PageHeader } from "@/components/public/PageHeader";
import { PageViewTracker } from "@/components/public/PageViewTracker";
import { SiteBranding } from "@/components/public/SiteBranding";
import {
	getBlocksByPageId,
	getChildBlocksByParentId,
	getPageByUserAndSubSlug,
	getUserById,
} from "@/lib/db/queries";
import { resolveTheme } from "@/lib/themes/resolve";
import { themeToCssVars } from "@/lib/themes/to-css-vars";
import type { ThemeConfig } from "@/lib/themes/types";

export const revalidate = 60;

interface SubPageProps {
	params: Promise<{ slug: string; subSlug: string }>;
}

export async function generateMetadata({
	params,
}: SubPageProps): Promise<Metadata> {
	const { slug: username, subSlug } = await params;
	const page = await getPageByUserAndSubSlug(username, subSlug);

	if (!page || !page.isPublished) {
		return { title: "Page not found" };
	}

	const user = await getUserById(page.userId);
	const displayName = user?.name || user?.username || username;
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

export default async function SubPage({ params }: SubPageProps) {
	const { slug: username, subSlug } = await params;
	const page = await getPageByUserAndSubSlug(username, subSlug);

	if (!page || !page.isPublished) {
		notFound();
	}

	const [user, topLevelBlocks] = await Promise.all([
		getUserById(page.userId),
		getBlocksByPageId(page.id),
	]);

	// Attach children to group blocks so they render correctly
	const blocks = await Promise.all(
		topLevelBlocks.map(async (block) => {
			if (block.type === "group") {
				const children = await getChildBlocksByParentId(block.id);
				return { ...block, children };
			}
			return block;
		}),
	);

	const theme = resolveTheme(
		page.themeId ?? "default",
		(page.themeOverrides as Partial<ThemeConfig>) ?? {},
	);
	const cssVars = themeToCssVars(theme);

	return (
		<>
			{/* Lightweight client-side page view beacon */}
			<PageViewTracker pageId={page.id} />

			<div className="bio-page" style={cssVars as CSSProperties}>
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

				{/* "Made with biohasl.ink" branding footer (free tier only) */}
				{!user?.isPro && <SiteBranding />}
			</div>
		</>
	);
}
