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
		return NextResponse.json({ error: "not_found" }, { status: 404 });
	}

	const data = block.data as unknown as LinkBlockData;

	if (!data.verificationEnabled || !data.verificationMode) {
		return NextResponse.json({ error: "not_found" }, { status: 404 });
	}

	const mode = data.verificationMode;

	const formData = await request.formData();

	if (mode === "age") {
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
			return NextResponse.json({ error: "invalid" }, { status: 400 });
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
			return NextResponse.json({ error: "underage" }, { status: 400 });
		}
	}

	// Verification passed — set cookie and return the redirect URL for the client
	const response = NextResponse.json(
		{ ok: true, redirectUrl: `/r/${blockId}` },
		{ status: 200 },
	);

	response.cookies.set(`bio_verified_${blockId}`, "1", {
		httpOnly: true,
		sameSite: "lax",
		maxAge: 3600, // 1 hour
		path: "/",
	});

	return response;
}
