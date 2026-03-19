// Israeli retailer whitelist for product links
// V1 only allows product links from approved retailers

export const RETAILER_WHITELIST = [
  { domain: "foxhome.co.il", name: "FOX HOME" },
  { domain: "golfco.co.il", name: "Golf & Co" },
  { domain: "naamanp.co.il", name: "Naaman" },
  { domain: "ace.co.il", name: "ACE" },
  { domain: "keter.com", name: "Keter Israel" },
  { domain: "ikea.com", name: "IKEA" },
  { domain: "terminalx.com", name: "Terminal X" },
  { domain: "asos.com", name: "ASOS" },
  { domain: "amazon.com", name: "Amazon" },
  { domain: "next.co.il", name: "NEXT" },
  { domain: "zara.com", name: "Zara" },
  { domain: "hm.com", name: "H&M" },
  { domain: "castro.com", name: "Castro" },
  { domain: "renuar.co.il", name: "Renuar" },
  { domain: "urbanica.co.il", name: "Urbanica" },
];

/**
 * Extract domain from URL
 * @param urlString - Full URL
 * @returns Domain hostname (e.g., "foxhome.co.il")
 */
export function extractDomain(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Check if a URL is from an approved retailer
 * @param urlString - Full URL to validate
 * @returns True if domain is whitelisted
 */
export function isRetailerWhitelisted(urlString: string): boolean {
  const domain = extractDomain(urlString);
  if (!domain) return false;

  return RETAILER_WHITELIST.some(
    (retailer) => retailer.domain === domain
  );
}

/**
 * Get retailer name by domain
 * @param domain - Retailer domain
 * @returns Friendly name or domain if not found
 */
export function getRetailerName(domain: string): string {
  const retailer = RETAILER_WHITELIST.find(
    (r) => r.domain === domain.toLowerCase()
  );
  return retailer?.name || domain;
}

/**
 * Get all whitelisted domains
 * @returns Array of domain strings
 */
export function getWhitelistedDomains(): string[] {
  return RETAILER_WHITELIST.map((r) => r.domain);
}
