const FETCH_TIMEOUT = 8000;
const SHIPPING_PATHS = ["/shipping", "/delivery", "/faq", "/about", "/help"];
const DELIVERY_KEYWORDS = ["Israel", "ישראל", "worldwide", "international shipping", "global delivery"];
const HEBREW_RANGE_START = 0x0590;
const HEBREW_RANGE_END = 0x05FF;

/**
 * Strip HTML tags to get visible text content from a body element.
 */
function stripHtml(html: string): string {
  // Remove script and style blocks first
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  // Remove tags
  return cleaned.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Check if >20% of non-whitespace chars are Hebrew.
 */
function detectHebrew(text: string): { isHebrew: boolean; percentage: number } {
  const chars = text.replace(/\s/g, "");
  if (chars.length === 0) return { isHebrew: false, percentage: 0 };

  let hebrewCount = 0;
  for (const char of chars) {
    const code = char.codePointAt(0) || 0;
    if (code >= HEBREW_RANGE_START && code <= HEBREW_RANGE_END) {
      hebrewCount++;
    }
  }

  const percentage = Math.round((hebrewCount / chars.length) * 100);
  return { isHebrew: percentage > 20, percentage };
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SimchaList/1.0; +https://simchalist.co.il)",
      },
      redirect: "follow",
    });

    clearTimeout(timeoutId);
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("text/html")) return null;

    return await response.text();
  } catch {
    return null;
  }
}

export interface DeliveryResult {
  deliversToIsrael: "yes" | "no" | "unknown";
  evidence: string | null;
}

/**
 * Check if a domain likely delivers to Israel.
 * 1. Check homepage for Hebrew content (>20% Hebrew chars)
 * 2. Check shipping/about pages for delivery keywords
 */
export async function checkIsraelDelivery(domain: string): Promise<DeliveryResult> {
  // Step 1: Check homepage for Hebrew
  const homepage = await fetchPage(`https://${domain}`);
  if (homepage) {
    const bodyMatch = homepage.match(/<body[\s\S]*?>([\s\S]*)<\/body>/i);
    const bodyText = bodyMatch ? stripHtml(bodyMatch[1]) : stripHtml(homepage);
    const { isHebrew, percentage } = detectHebrew(bodyText);

    if (isHebrew) {
      return {
        deliversToIsrael: "yes",
        evidence: `Hebrew homepage (${percentage}% Hebrew characters)`,
      };
    }
  }

  // Step 2: Check shipping/delivery pages
  for (const path of SHIPPING_PATHS) {
    const html = await fetchPage(`https://${domain}${path}`);
    if (!html) continue;

    const text = stripHtml(html).toLowerCase();
    for (const keyword of DELIVERY_KEYWORDS) {
      if (text.includes(keyword.toLowerCase())) {
        return {
          deliversToIsrael: "yes",
          evidence: `Found "${keyword}" on ${path}`,
        };
      }
    }
  }

  return { deliversToIsrael: "unknown", evidence: null };
}
