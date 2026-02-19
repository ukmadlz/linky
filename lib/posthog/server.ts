import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  if (_client) return _client;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key || !host) return null;

  _client = new PostHog(key, {
    host,
    flushAt: 1,
    flushInterval: 0,
  });

  return _client;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const client = getPostHogClient();
  if (!client) return;

  client.capture({
    distinctId,
    event,
    properties: properties ?? {},
  });

  await client.flush();
}
