import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  if (typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key || !host) return;

  posthog.init(key, {
    api_host: host,
    // Manual pageviews for dashboard routes only
    capture_pageview: false,
    // Lean setup — opt-in only
    autocapture: false,
    session_recording: {
      maskAllInputs: true,
    },
    disable_session_recording: true,
    disable_surveys: true,
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") {
        ph.opt_out_capturing();
      }
    },
  });

  initialized = true;
}

export { posthog };
