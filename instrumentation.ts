// Next.js instrumentation hook
// This file is automatically loaded by Next.js when it exists

export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		const { initTelemetry } = await import("./lib/telemetry");
		initTelemetry();
	}
}
