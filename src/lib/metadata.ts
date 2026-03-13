import { isRetailerWhitelisted, extractDomain } from "./retailer-whitelist";
import { FetchedMetadata } from "@/types/product";

const FETCH_TIMEOUT = 5000; // 5 seconds
const MAX_RESPONSE_SIZE = 1024 * 1024; // 1MB

/**
 * Validates that a URL uses HTTPS and is from a whitelisted retailer
 */
function validateUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);

    // Only allow HTTPS
    if (url.protocol !== "https:") {
      return { valid: false, error: "Only HTTPS URLs are allowed" };
    }

    // Whitelist check
    if (!isRetailerWhitelisted(urlString)) {
      return { valid: false, error: "Retailer is not whitelisted" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Parse Open Graph and HTML metadata from page content
 */
function parseMetadata(
  html: string,
  domain: string
): Partial<FetchedMetadata> {
  const metadata: Partial<FetchedMetadata> = { domain };

  // Extract Open Graph title
  const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
  if (ogTitleMatch?.[1]) {
    metadata.title = ogTitleMatch[1];
  }

  // Fallback to HTML title if no og:title
  if (!metadata.title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch?.[1]) {
      metadata.title = titleMatch[1];
    }
  }

  // Extract Open Graph image
  const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i);
  if (ogImageMatch?.[1]) {
    metadata.image = ogImageMatch[1];
  }

  // Extract Open Graph price (optional)
  const ogPriceMatch = html.match(/<meta\s+property="og:price:amount"\s+content="([^"]*)"/i);
  if (ogPriceMatch?.[1]) {
    const price = parseFloat(ogPriceMatch[1]);
    if (!isNaN(price)) {
      metadata.price = Math.round(price);
    }
  }

  return metadata;
}

/**
 * Fetch and parse metadata from a product URL
 * Server-side only, with SSRF protection
 */
export async function fetchMetadata(
  urlString: string
): Promise<{ success: boolean; data?: FetchedMetadata; error?: string }> {
  // Validate URL
  const validation = validateUrl(urlString);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const domain = extractDomain(urlString);
    if (!domain) {
      return { success: false, error: "Could not extract domain" };
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(urlString, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SimchaList/1.0; +https://simchalist.co.il)",
      },
      redirect: "follow",
      // Prevent SSRF by not following external redirects
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: Unable to fetch page`,
      };
    }

    // Check response size to prevent DoS
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      return {
        success: false,
        error: "Response too large",
      };
    }

    // Only parse HTML responses
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("text/html")) {
      return {
        success: false,
        error: "Expected HTML response",
      };
    }

    const html = await response.text();

    // Limit HTML size to prevent memory issues
    if (html.length > MAX_RESPONSE_SIZE) {
      return {
        success: false,
        error: "Page content too large",
      };
    }

    const metadata = parseMetadata(html, domain);

    // Require at least a title
    if (!metadata.title) {
      return {
        success: false,
        error: "Could not find product information on page",
      };
    }

    return { success: true, data: metadata };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return { success: false, error: "Request timeout" };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unknown error fetching metadata" };
  }
}
