import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
	createPage,
	duplicatePageBlocks,
	getPageById,
	getPageBySlug,
	getPagesByUserId,
	updatePage,
} from "@/lib/db/queries";
import { captureServerEvent } from "@/lib/posthog/server";

export async function POST(
	_request: Request,
	{ params }: { params: Promise<{ pageId: string }> },
) {
	const user = await requireAuth();
	const { pageId } = await params;

	const sourcePage = await getPageById(pageId);
	if (!sourcePage || sourcePage.userId !== user.id) {
		return NextResponse.json({ error: "Page not found" }, { status: 404 });
	}

	const existingPages = await getPagesByUserId(user.id);

	// Generate a unique subSlug within this user's pages
	let subSlug = `copy-${nanoid(6)}`;
	while (existingPages.some((p) => p.subSlug === subSlug)) {
		subSlug = `copy-${nanoid(6)}`;
	}

	// Generate a unique global slug for internal use
	let slug = `${user.username ?? nanoid()}-${nanoid(6)}`;
	while (await getPageBySlug(slug)) {
		slug = `${user.username ?? nanoid()}-${nanoid(6)}`;
	}

	const newPage = await createPage({
		userId: user.id,
		slug,
		subSlug,
		title: `Copy of ${sourcePage.title ?? sourcePage.slug}`,
	});

	const finalPage = await updatePage(newPage.id, {
		description: sourcePage.description,
		themeId: sourcePage.themeId,
		themeOverrides: sourcePage.themeOverrides,
		seoTitle: sourcePage.seoTitle,
		seoDescription: sourcePage.seoDescription,
		ogImageUrl: sourcePage.ogImageUrl,
		isPublished: false,
	});

	await duplicatePageBlocks(sourcePage.id, newPage.id);

	captureServerEvent(user.id, "page_duplicated", {
		sourcePageId: sourcePage.id,
		newPageId: newPage.id,
	}).catch(console.error);

	return NextResponse.json(finalPage ?? newPage, { status: 201 });
}
