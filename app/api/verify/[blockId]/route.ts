import { NextResponse } from "next/server";
import type { LinkBlockData } from "@/lib/blocks/schemas";
import { getBlockById } from "@/lib/db/queries";

interface Params {
	params: Promise<{ blockId: string }>;
}

export async function POST(request: Request, { params }: Params) {
	const { blockId } = await params;

	const block = await getBlockById(blockId);

	if (!block) {
		return NextResponse.redirect(new URL("/", request.url), { status: 302 });
	}

	const data = block.data as unknown as LinkBlockData;

	if (!data.verificationEnabled || !data.verificationMode) {
		return NextResponse.redirect(new URL("/", request.url), { status: 302 });
	}

	const mode = data.verificationMode;

	if (mode === "age") {
		// Parse submitted DOB from form body
		const formData = await request.formData();
		const day = Number(formData.get("day"));
		const month = Number(formData.get("month"));
		const year = Number(formData.get("year"));

		if (
			!day ||
			!month ||
			!year ||
			Number.isNaN(day) ||
			Number.isNaN(month) ||
			Number.isNaN(year)
		) {
			return NextResponse.redirect(
				new URL(`/verify/${blockId}?error=invalid`, request.url),
				{ status: 302 },
			);
		}

		// Compute age — DOB is never stored
		const dob = new Date(year, month - 1, day);
		const now = new Date();
		let age = now.getFullYear() - dob.getFullYear();
		const monthDiff = now.getMonth() - dob.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
			age--;
		}

		if (age < 18) {
			return NextResponse.redirect(
				new URL(`/verify/${blockId}?error=underage`, request.url),
				{ status: 302 },
			);
		}
	}

	// Verification passed (age ≥ 18, or acknowledge mode)
	// Set httpOnly cookie valid for 1 hour — contains only a boolean flag, no personal data
	const response = NextResponse.redirect(
		new URL(`/r/${blockId}`, request.url),
		{ status: 302 },
	);

	response.cookies.set(`bio_verified_${blockId}`, "1", {
		httpOnly: true,
		sameSite: "lax",
		maxAge: 3600, // 1 hour
		path: "/",
	});

	return response;
}
