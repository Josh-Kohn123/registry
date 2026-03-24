import { searchSiteForProducts } from "./google-search";

const FETCH_TIMEOUT = 8000;
const PRODUCT_PATH_PATTERNS = ["/product/", "/p/", "/item/", "/shop/", "/products/"];

async function fetchText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SimchaList/1.0; +https://simchalist.co.il)",
      },
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Parse robots.txt for sitemap URLs and disallowed paths.
 */
function parseRobotsTxt(content: string): { sitemaps: string[]; disallowed: string[] } {
  const sitemaps: string[] = [];
  const disallowed: string[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith("sitemap:")) {
      sitemaps.push(trimmed.slice("sitemap:".length).trim());
    }
    if (trimmed.toLowerCase().startsWith("disallow:")) {
      const path = trimmed.slice("disallow:".length).trim();
      if (path) disallowed.push(path);
    }
  }

  return { sitemaps, disallowed };
}

/**
 * Extract URLs from a sitemap XML string.
 */
function parseSitemap(xml: string): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>(.*?)<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

/**
 * Check if a URL path is disallowed by robots.txt rules.
 */
function isDisallowed(url: string, disallowed: string[]): boolean {
  try {
    const path = new URL(url).pathname;
    return disallowed.some((d) => path.startsWith(d));
  } catch {
    return false;
  }
}

/**
 * Find product page URLs on a retailer domain.
 * Strategy: robots.txt → sitemap → Google fallback → homepage links
 */
export async function findProductPages(domain: string): Promise<string[]> {
  let disallowed: string[] = [];

  // Step 1: Check robots.txt
  const robotsTxt = await fetchText(`https://${domain}/robots.txt`);
  let sitemapUrls: string[] = [];

  if (robotsTxt) {
    const parsed = parseRobotsTxt(robotsTxt);
    sitemapUrls = parsed.sitemaps;
    disallowed = parsed.disallowed;
  }

  // Default sitemap if none declared
  if (sitemapUrls.length === 0) {
    sitemapUrls = [`https://${domain}/sitemap.xml`];
  }

  // Step 2: Parse sitemaps for product URLs
  for (const sitemapUrl of sitemapUrls.slice(0, 3)) { // limit to 3 sitemaps
    const sitemapContent = await fetchText(sitemapUrl);
    if (!sitemapContent) continue;

    // Check if it's a sitemap index (contains other sitemaps)
    const nestedSitemaps = parseSitemap(sitemapContent).filter((u) =>
      u.toLowerCase().includes("sitemap")
    );

    const allUrls: string[] = [];

    if (nestedSitemaps.length > 0) {
      // Parse first nested sitemap that looks product-related
      const productSitemap = nestedSitemaps.find((u) =>
        u.toLowerCase().includes("product")
      ) || nestedSitemaps[0];

      const nestedContent = await fetchText(productSitemap);
      if (nestedContent) {
        allUrls.push(...parseSitemap(nestedContent));
      }
    } else {
      allUrls.push(...parseSitemap(sitemapContent));
    }

    // Filter for product-like URLs
    const productUrls = allUrls
      .filter((url) => PRODUCT_PATH_PATTERNS.some((p) => url.toLowerCase().includes(p)))
      .filter((url) => !isDisallowed(url, disallowed))
      .slice(0, 3);

    if (productUrls.length > 0) return productUrls;
  }

  // Step 3: Google fallback (costs 1 API query)
  const googleResults = await searchSiteForProducts(domain);
  const filtered = googleResults
    .filter((url) => !isDisallowed(url, disallowed))
    .slice(0, 3);

  if (filtered.length > 0) return filtered;

  // Step 4: Try homepage links as last resort
  const homepage = await fetchText(`https://${domain}`);
  if (homepage) {
    const hrefRegex = /href="(https?:\/\/[^"]*?)"/gi;
    const links: string[] = [];
    let m;
    while ((m = hrefRegex.exec(homepage)) !== null) {
      const href = m[1];
      if (
        href.includes(domain) &&
        PRODUCT_PATH_PATTERNS.some((p) => href.toLowerCase().includes(p)) &&
        !isDisallowed(href, disallowed)
      ) {
        links.push(href);
      }
    }
    return links.slice(0, 3);
  }

  return [];
}
