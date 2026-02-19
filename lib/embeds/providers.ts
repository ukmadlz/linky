export interface IframeResult {
  iframeUrl: string;
  providerName: string;
  embedType: "iframe";
  aspectRatio: string;
}

interface IframePattern {
  match: RegExp;
  transform: (url: string, match: RegExpMatchArray) => string | null;
  aspectRatio: string | ((match: RegExpMatchArray) => string);
  providerName: string;
}

const IFRAME_PATTERNS: IframePattern[] = [
  // YouTube: /watch?v=ID or /shorts/ID or youtu.be/ID
  {
    match: /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    transform: (_url, match) =>
      `https://www.youtube-nocookie.com/embed/${match[1]}`,
    aspectRatio: "16/9",
    providerName: "YouTube",
  },
  // Spotify: /track/ID, /album/ID, /playlist/ID
  {
    match: /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/,
    transform: (_url: string, match: RegExpMatchArray) =>
      `https://open.spotify.com/embed/${match[1]}/${match[2]}`,
    aspectRatio: (match: RegExpMatchArray) =>
      match[1] === "track" ? "2/1" : "16/9",
    providerName: "Spotify",
  },
  // Vimeo: /123456789
  {
    match: /vimeo\.com\/(\d+)/,
    transform: (_url, match) =>
      `https://player.vimeo.com/video/${match[1]}`,
    aspectRatio: "16/9",
    providerName: "Vimeo",
  },
  // SoundCloud
  {
    match: /soundcloud\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)/,
    transform: (url) =>
      `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%235f4dc5&auto_play=false&hide_related=true&show_comments=false`,
    aspectRatio: "3/1",
    providerName: "SoundCloud",
  },
  // Google Maps embed
  {
    match: /(?:google\.com\/maps|maps\.google\.com)\/(?:embed\?|place\/|@)/,
    transform: (url) => {
      // If already an embed URL, use directly
      if (url.includes("google.com/maps/embed")) return url;
      return null;
    },
    aspectRatio: "4/3",
    providerName: "Google Maps",
  },
];

export function resolveIframe(url: string): IframeResult | null {
  for (const pattern of IFRAME_PATTERNS) {
    const match = url.match(pattern.match);
    if (match) {
      const iframeUrl = pattern.transform(url, match);
      if (!iframeUrl) continue;

      const aspectRatio =
        typeof pattern.aspectRatio === "function"
          ? (pattern.aspectRatio as (m: RegExpMatchArray) => string)(match)
          : pattern.aspectRatio;

      return {
        iframeUrl,
        providerName: pattern.providerName,
        embedType: "iframe",
        aspectRatio,
      };
    }
  }
  return null;
}
