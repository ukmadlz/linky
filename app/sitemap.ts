import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://biohasl.ink";

	// Static routes
	const staticRoutes: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 1,
		},
	];

	// Dynamic public page routes
	try {
		const publishedPages = await db
			.select({ slug: pages.slug, updatedAt: pages.updatedAt })
			.from(pages)
			.where(eq(pages.isPublished, true));

		const pageRoutes: MetadataRoute.Sitemap = publishedPages.map((page) => ({
			url: `${baseUrl}/${page.slug}`,
			lastModified: page.updatedAt ?? new Date(),
			changeFrequency: "weekly" as const,
			priority: 0.8,
		}));

		return [...staticRoutes, ...pageRoutes];
	} catch {
		// If DB is unavailable during build, return static routes only
		return staticRoutes;
	}
}
