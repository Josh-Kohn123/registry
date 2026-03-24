const FETCH_TIMEOUT = 8000;

export interface OgScore {
  hasOgTitle: boolean;
  hasOgImage: boolean;
  hasOgPrice: boolean;
  score: number; // 0-3
  title: string | null;
  imageUrl: string | null;
  siteName: string | null;
}

/**
 * Fetch a product page and score its OG tags (0-3).
 */
export async function scoreProductPage(url: string): Promise<OgScore> {
  const result: OgScore = {
    hasOgTitle: false,
    hasOgImage: false,
    hasOgPrice: false,
    score: 0,
    title: null,
    imageUrl: null,
    siteName: null,
  };

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
    if (!response.ok) return result;

    const html = await response.text();

    // Helper: extract content from a meta tag regardless of attribute order
    function getMetaContent(html: string, property: string): string | null {
      // Match property="X" content="Y" (either order)
      const pattern1 = new RegExp(`<meta\\s+(?:property|name)="${property}"\\s+content="([^"]*)"`, "i");
      const pattern2 = new RegExp(`<meta\\s+content="([^"]*)"\\s+(?:property|name)="${property}"`, "i");
      const match = html.match(pattern1) || html.match(pattern2);
      return match?.[1] || null;
    }

    // og:title
    const ogTitle = getMetaContent(html, "og:title");
    if (ogTitle) {
      result.hasOgTitle = true;
      result.title = ogTitle;
    } else {
      // Fallback to <title>
      const htmlTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (htmlTitle?.[1]) {
        result.title = htmlTitle[1].trim();
      }
    }

    // og:image
    const ogImage = getMetaContent(html, "og:image");
    if (ogImage) {
      result.hasOgImage = true;
      result.imageUrl = ogImage;
    }

    // og:price:amount or product:price:amount
    const ogPrice = getMetaContent(html, "og:price:amount") || getMetaContent(html, "product:price:amount");
    if (ogPrice) {
      const price = parseFloat(ogPrice);
      if (!isNaN(price)) {
        result.hasOgPrice = true;
      }
    }

    // og:site_name (for retailer name)
    const siteName = getMetaContent(html, "og:site_name");
    if (siteName) {
      result.siteName = siteName;
    }

    result.score = [result.hasOgTitle, result.hasOgImage, result.hasOgPrice].filter(Boolean).length;
  } catch {
    // Return default score of 0
  }

  return result;
}

/**
 * Score multiple product pages and return the best result.
 */
export async function scoreBestProduct(
  urls: string[]
): Promise<{ bestScore: OgScore; bestUrl: string } | null> {
  let best: OgScore | null = null;
  let bestUrl = "";

  for (const url of urls) {
    const score = await scoreProductPage(url);
    if (!best || score.score > best.score) {
      best = score;
      bestUrl = url;
    }
    // Stop early if we find a perfect 3/3
    if (score.score === 3) break;

    // Polite delay between requests
    await new Promise((r) => setTimeout(r, 500));
  }

  return best ? { bestScore: best, bestUrl } : null;
}
