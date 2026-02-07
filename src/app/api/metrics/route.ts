import { exportPrometheusMetrics } from "@/lib/integrations/monitoring";
import { NextResponse } from "next/server";

/**
 * Prometheus metrics endpoint
 * Exposes application metrics in Prometheus format for scraping
 */
export async function GET() {
	try {
		const metrics = await exportPrometheusMetrics();

		return new NextResponse(metrics, {
			headers: {
				"Content-Type": "text/plain; version=0.0.4",
			},
		});
	} catch (error) {
		console.error("Failed to export Prometheus metrics:", error);

		return NextResponse.json({ error: "Failed to generate metrics" }, { status: 500 });
	}
}
