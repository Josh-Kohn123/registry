const CSE_API_URL = "https://www.googleapis.com/customsearch/v1";

export interface SearchResult {
  domain: string;
  url: string;
  title: string;
}

let queriesUsed = 0;
const MAX_QUERIES = 100; // Google CSE free tier

export function getQueriesUsed(): number {
  return queriesUsed;
}

export function getRemainingQuota(): number {
  return MAX_QUERIES - queriesUsed;
}

/**
 * Search Google Custom Search and extract unique domains from results.
 */
export async function searchGoogle(query: string): Promise<SearchResult[]> {
  if (queriesUsed >= MAX_QUERIES) {
    console.log(`[quota] API quota exhausted (${queriesUsed}/${MAX_QUERIES})`);
    return [];
  }

  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) {
    throw new Error("Missing GOOGLE_CSE_API_KEY or GOOGLE_CSE_ID environment variables");
  }

  const params = new URLSearchParams({
    key: apiKey,
    cx: cseId,
    q: query,
    num: "10",
  });

  const response = await fetch(`${CSE_API_URL}?${params}`);
  queriesUsed++;

  if (!response.ok) {
    console.error(`[google] Search failed for "${query}": ${response.status}`);
    return [];
  }

  const data = await response.json();
  const items: Array<{ link: string; title: string }> = data.items || [];

  return items.map((item) => {
    const url = new URL(item.link);
    return {
      domain: url.hostname.toLowerCase().replace(/^www\./, ""),
      url: item.link,
      title: item.title,
    };
  }).filter((r) => r.domain.includes(".")); // basic sanity
}

/**
 * Google site-specific search to find product pages on a domain.
 * Costs 1 API query.
 */
export async function searchSiteForProducts(domain: string): Promise<string[]> {
  const results = await searchGoogle(`site:${domain} product`);
  return results.map((r) => r.url);
}
