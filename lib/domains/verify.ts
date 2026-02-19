import dns from "dns/promises";

const APP_HOSTNAME = new URL(
  process.env.NEXT_PUBLIC_APP_URL ?? "https://biohasl.ink"
).hostname;

/**
 * Verify domain by checking that its CNAME record points to our app hostname.
 * Returns true if verified, false otherwise.
 */
export async function verifyDomain(domain: string): Promise<boolean> {
  try {
    const cnames = await dns.resolveCname(domain);
    return cnames.some((cname) => cname.replace(/\.$/, "") === APP_HOSTNAME);
  } catch {
    // CNAME not found — try A record fallback
    try {
      const appAddresses = await dns.resolve4(APP_HOSTNAME);
      const domainAddresses = await dns.resolve4(domain);
      return domainAddresses.some((ip) => appAddresses.includes(ip));
    } catch {
      return false;
    }
  }
}

/**
 * The CNAME target that users should point their domain to.
 */
export function getCnameTarget(): string {
  return APP_HOSTNAME;
}
