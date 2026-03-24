import { prisma } from "@/lib/prisma";

type WhitelistEntry = {
  domain: string;
  name: string;
  allowedPaths: string | null;
  isActive: boolean;
};

// In-memory cache with 5-minute TTL
let cache: WhitelistEntry[] = [];
let lastFetched = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getWhitelist(): Promise<WhitelistEntry[]> {
  const now = Date.now();
  if (cache.length > 0 && now - lastFetched < CACHE_TTL) {
    return cache;
  }

  const entries = await prisma.retailerWhitelist.findMany({
    where: { isActive: true },
    select: { domain: true, name: true, allowedPaths: true, isActive: true },
  });

  cache = entries;
  lastFetched = now;
  return cache;
}

/**
 * Extract domain from URL
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
 * Find the matching whitelist entry for a domain (supports subdomain matching).
 */
async function findMatchingRetailer(domain: string): Promise<WhitelistEntry | undefined> {
  const whitelist = await getWhitelist();
  return whitelist.find(
    (r) => r.domain === domain || domain.endsWith("." + r.domain)
  );
}

/**
 * Check if a URL is from an approved retailer (async, DB-backed).
 * Also enforces allowedPaths if the retailer has path restrictions.
 */
export async function isRetailerWhitelisted(urlString: string): Promise<boolean> {
  const domain = extractDomain(urlString);
  if (!domain) return false;

  const retailer = await findMatchingRetailer(domain);
  if (!retailer) return false;

  // Check path restriction if configured (e.g., Keter's "/he-il/")
  if (retailer.allowedPaths) {
    try {
      const url = new URL(urlString);
      if (!url.pathname.startsWith(retailer.allowedPaths)) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Get retailer name by domain (async, DB-backed, supports subdomain matching).
 */
export async function getRetailerName(domain: string): Promise<string> {
  const normalized = domain.toLowerCase();
  const retailer = await findMatchingRetailer(normalized);
  return retailer?.name || domain;
}

/**
 * Get all whitelisted domains (async, DB-backed)
 */
export async function getWhitelistedDomains(): Promise<string[]> {
  const whitelist = await getWhitelist();
  return whitelist.map((r) => r.domain);
}

/**
 * @deprecated Use the async functions instead.
 * This getter exists to catch any missed migration from the old synchronous API.
 */
export const RETAILER_WHITELIST: never[] = new Proxy([] as never[], {
  get(target, prop) {
    if (prop === "length") return 0;
    if (typeof prop === "string" && !isNaN(Number(prop))) {
      throw new Error(
        "RETAILER_WHITELIST is deprecated. Use getWhitelistedDomains() or getWhitelist() instead."
      );
    }
    return Reflect.get(target, prop);
  },
});
