export interface OEmbedResult {
  providerName: string;
  embedType: "oembed";
  oembedData: Record<string, unknown>;
  embedHtml?: string;
}

// Known oEmbed providers: domain → endpoint
const KNOWN_PROVIDERS: Record<string, string> = {
  "youtube.com": "https://www.youtube.com/oembed",
  "youtu.be": "https://www.youtube.com/oembed",
  "vimeo.com": "https://vimeo.com/api/oembed.json",
  "spotify.com": "https://open.spotify.com/oembed",
  "open.spotify.com": "https://open.spotify.com/oembed",
  "soundcloud.com": "https://soundcloud.com/oembed",
  "twitter.com": "https://publish.twitter.com/oembed",
  "x.com": "https://publish.twitter.com/oembed",
  "typeform.com": "https://api.typeform.com/oembed",
  "tiktok.com": "https://www.tiktok.com/oembed",
};

function getKnownEndpoint(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");
    return KNOWN_PROVIDERS[hostname] ?? null;
  } catch {
    return null;
  }
}

async function fetchOEmbed(
  endpoint: string,
  url: string
): Promise<Record<string, unknown> | null> {
  try {
    const params = new URLSearchParams({ url, format: "json" });
    const response = await fetch(`${endpoint}?${params}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function discoverOEmbedEndpoint(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "biohasl.ink/1.0 oEmbed-Fetcher" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;

    const html = await response.text();
    // Parse <link rel="alternate" type="application/json+oembed" href="...">
    const match = html.match(
      /<link[^>]+type=["']application\/json\+oembed["'][^>]+href=["']([^"']+)["']/i
    );
    if (match) return match[1];

    // Also try href before type
    const match2 = html.match(
      /<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/json\+oembed["']/i
    );
    return match2 ? match2[1] : null;
  } catch {
    return null;
  }
}

export async function resolveOEmbed(url: string): Promise<OEmbedResult | null> {
  let endpoint = getKnownEndpoint(url);

  if (!endpoint) {
    endpoint = await discoverOEmbedEndpoint(url);
  }

  if (!endpoint) return null;

  const data = await fetchOEmbed(endpoint, url);
  if (!data) return null;

  const providerName =
    typeof data.provider_name === "string" ? data.provider_name : "Unknown";
  const embedHtml =
    typeof data.html === "string" ? data.html : undefined;

  return {
    providerName,
    embedType: "oembed",
    oembedData: data,
    embedHtml,
  };
}
