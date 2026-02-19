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
  // Calendly: calendly.com/user or calendly.com/user/event-type
  {
    match: /calendly\.com\/([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?)/,
    transform: (_url, match) =>
      `https://calendly.com/${match[1]}?embed_domain=biohasl.ink&embed_type=Inline`,
    aspectRatio: "3/4",
    providerName: "Calendly",
  },
  // Typeform: user.typeform.com/to/formID
  {
    match: /(?:[a-zA-Z0-9-]+\.)?typeform\.com\/to\/([a-zA-Z0-9]+)/,
    transform: (_url, match) =>
      `https://form.typeform.com/to/${match[1]}?typeform-embed=embed-widget`,
    aspectRatio: "1/1",
    providerName: "Typeform",
  },
  // Gumroad: gumroad.com/l/productID or gumroad.com/products
  {
    match: /gumroad\.com\/l\/([a-zA-Z0-9_-]+)/,
    transform: (_url, match) =>
      `https://gumroad.com/l/${match[1]}?as_embed=true`,
    aspectRatio: "3/4",
    providerName: "Gumroad",
  },
  // Stripe Payment Links: buy.stripe.com/XXXX
  {
    match: /buy\.stripe\.com\/([a-zA-Z0-9_-]+)/,
    transform: (_url, match) =>
      `https://buy.stripe.com/${match[1]}#embedded`,
    aspectRatio: "3/4",
    providerName: "Stripe",
  },
  // Apple Music: music.apple.com/us/album|playlist|artist
  {
    match: /music\.apple\.com\/([a-z]{2})\/(?:album|playlist|artist)\/[^/]+\/([a-z0-9.-]+)/,
    transform: (url) => {
      const embedUrl = url
        .replace("music.apple.com", "embed.music.apple.com")
        .replace("/album/", "/album/")
        .replace("/playlist/", "/playlist/");
      return embedUrl;
    },
    aspectRatio: "3/2",
    providerName: "Apple Music",
  },
  // TikTok: tiktok.com/@user/video/ID or vm.tiktok.com/shortcode
  {
    match: /tiktok\.com\/@[^/]+\/video\/(\d+)/,
    transform: (_url, match) =>
      `https://www.tiktok.com/embed/v2/${match[1]}`,
    aspectRatio: "9/16",
    providerName: "TikTok",
  },
  // Twitch channel: twitch.tv/channel
  {
    match: /twitch\.tv\/([a-zA-Z0-9_]+)(?:\/clip\/([a-zA-Z0-9_-]+))?$/,
    transform: (_url, match) => {
      if (match[2]) {
        return `https://clips.twitch.tv/embed?clip=${match[2]}&parent=biohasl.ink&autoplay=false`;
      }
      return `https://player.twitch.tv/?channel=${match[1]}&parent=biohasl.ink&autoplay=false`;
    },
    aspectRatio: "16/9",
    providerName: "Twitch",
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
