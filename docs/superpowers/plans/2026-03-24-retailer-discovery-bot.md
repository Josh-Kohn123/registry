# Retailer Discovery Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a discovery bot that finds retailers via Google search, validates them for Israel delivery + OG tag compatibility, and presents them to an admin for batch approval — while refactoring the hardcoded whitelist to be database-backed.

**Architecture:** A standalone CLI script discovers and validates retailers, writing candidates to a `discovered_retailer` table. An admin panel tab shows pending discoveries grouped by batch with approve/reject controls. The hardcoded `retailer-whitelist.ts` is refactored to query Postgres via Prisma with a 5-minute in-memory cache, keeping the same export signatures but making them async.

**Tech Stack:** Next.js 16, PostgreSQL, Prisma, Google Custom Search API, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-24-retailer-discovery-bot-design.md`

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `scripts/discover-retailers.ts` | CLI entry point — orchestrates discovery pipeline |
| `src/lib/discovery/google-search.ts` | Google Custom Search API client + domain extraction |
| `src/lib/discovery/israel-check.ts` | Hebrew detection + shipping page keyword search |
| `src/lib/discovery/product-finder.ts` | Sitemap parsing, robots.txt, Google fallback for product URLs |
| `src/lib/discovery/og-scorer.ts` | OG tag extraction + scoring (0-3) |
| `src/lib/discovery/queries.ts` | Predefined search query list + rotation logic |
| `src/app/api/admin/retailers/discovery/route.ts` | GET pending discoveries, POST batch decisions |
| `src/app/api/admin/retailers/route.ts` | GET whitelist (paginated) |
| `src/app/api/admin/retailers/[id]/route.ts` | PUT update retailer (name, allowedPaths, isActive) |
| `src/components/admin/RetailerDiscovery.tsx` | Discovery queue UI with batch grouping + approve/reject |
| `src/components/admin/RetailerWhitelist.tsx` | Existing whitelist table with inline edit |

### Modified files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `DiscoveredRetailer`, `DiscoveryBatch` models + enums |
| `prisma/seed.ts` | Seed all 15 existing retailers into `retailer_whitelist` |
| `src/lib/retailer-whitelist.ts` | Replace hardcoded array with DB-backed async functions + cache |
| `src/lib/metadata.ts` | `await` the now-async `isRetailerWhitelisted` |
| `src/app/api/metadata/route.ts` | `await` the now-async `isRetailerWhitelisted` |
| `src/app/api/extension/products/route.ts` | `await` the now-async `isRetailerWhitelisted` |
| `src/app/api/extension/whitelist/route.ts` | Switch from `RETAILER_WHITELIST` constant to async `getWhitelist()` |
| `src/app/api/events/[eventId]/products/route.ts` | `await` async whitelist functions |
| `src/components/products/AddProductForm.tsx` | Accept `whitelistedDomains` as prop, use API for validation |
| `src/components/products/ProductCard.tsx` | Accept `retailerName` as prop instead of calling `getRetailerName` |
| `src/components/products/ProductListManager.tsx` | Accept retailer name map as prop or inline the domain |
| `src/app/[locale]/admin/page.tsx` | Add "Retailers" tab |

---

## Task 1: Prisma Schema — Add Discovery Models

**Files:**
- Modify: `prisma/schema.prisma` (append after `RetailerWhitelist` model, line ~348)

- [ ] **Step 1: Add enums and models to schema**

Add these to the end of `prisma/schema.prisma`:

```prisma
enum DeliveryStatus {
  yes
  no
  unknown
}

enum DiscoveryStatus {
  pending
  approved
  rejected
}

enum BatchStatus {
  running
  completed
  failed
}

model DiscoveryBatch {
  id               String      @id @default(cuid())
  startedAt        DateTime    @default(now())
  completedAt      DateTime?
  retailersFound   Int         @default(0)
  retailersSkipped Int         @default(0)
  searchQueries    String[]
  status           BatchStatus @default(running)

  discoveries      DiscoveredRetailer[]

  @@map("discovery_batches")
}

model DiscoveredRetailer {
  id                 String          @id @default(cuid())
  domain             String          @unique
  name               String
  batchId            String
  discoverySource    String          // "google_search" or "seed_list"
  searchQuery        String?
  hasOgTitle         Boolean         @default(false)
  hasOgImage         Boolean         @default(false)
  hasOgPrice         Boolean         @default(false)
  score              Int             @default(0)
  deliversToIsrael   DeliveryStatus  @default(unknown)
  deliveryEvidence   String?
  sampleProductUrl   String?
  sampleProductTitle String?
  sampleImageUrl     String?
  status             DiscoveryStatus @default(pending)
  rejectedAt         DateTime?
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  batch              DiscoveryBatch  @relation(fields: [batchId], references: [id], onDelete: Cascade)

  @@index([status])
  @@index([rejectedAt])
  @@map("discovered_retailers")
}
```

- [ ] **Step 2: Push schema to database**

Run: `npx prisma db push`
Expected: Schema synced, no errors. New tables `discovery_batches` and `discovered_retailers` created.

- [ ] **Step 3: Generate Prisma client**

Run: `npx prisma generate`
Expected: Client regenerated with new types.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add DiscoveryBatch and DiscoveredRetailer models"
```

---

## Task 2: Seed Existing 15 Retailers into Database

**Files:**
- Modify: `prisma/seed.ts` (replace the 5 existing retailer upserts with all 15)

- [ ] **Step 1: Update seed to include all 15 retailers**

Replace the existing 5 retailer upserts in `prisma/seed.ts` (lines 83-135) with upserts for all 15 domains from the current hardcoded list:

```typescript
const retailers = [
  { domain: "foxhome.co.il", name: "FOX HOME" },
  { domain: "golfco.co.il", name: "Golf & Co" },
  { domain: "naamanp.co.il", name: "Naaman" },
  { domain: "ace.co.il", name: "ACE" },
  { domain: "keter.com", name: "Keter Israel", allowedPaths: "/he-il/" },
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

for (const r of retailers) {
  await prisma.retailerWhitelist.upsert({
    where: { domain: r.domain },
    update: {},
    create: {
      domain: r.domain,
      name: r.name,
      allowedPaths: r.allowedPaths ?? null,
      isActive: true,
    },
  });
}

console.log(`Seeded ${retailers.length} retailer whitelist entries`);
```

- [ ] **Step 2: Run seed to verify**

Run: `npx prisma db seed`
Expected: "Seeded 15 retailer whitelist entries" in output.

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed all 15 existing retailers into whitelist table"
```

---

## Task 3: Refactor retailer-whitelist.ts to DB-backed

**Files:**
- Modify: `src/lib/retailer-whitelist.ts`

This is the critical refactor. Same exports, but async and DB-backed.

- [ ] **Step 1: Rewrite retailer-whitelist.ts**

Replace the entire file content with:

```typescript
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
```

- [ ] **Step 2: Verify the module compiles**

Run: `npx tsc --noEmit src/lib/retailer-whitelist.ts 2>&1 | head -20`
Expected: Type errors in consuming files (expected — we'll fix those next), but the module itself should be clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/retailer-whitelist.ts
git commit -m "refactor: replace hardcoded whitelist with DB-backed async functions"
```

---

## Task 4: Update API Route Call Sites (5 files)

**Files:**
- Modify: `src/lib/metadata.ts`
- Modify: `src/app/api/metadata/route.ts`
- Modify: `src/app/api/extension/products/route.ts`
- Modify: `src/app/api/extension/whitelist/route.ts`
- Modify: `src/app/api/events/[eventId]/products/route.ts`

All changes are the same pattern: add `await` before calls to the now-async whitelist functions.

- [ ] **Step 1: Update `src/lib/metadata.ts`**

Line 20: `isRetailerWhitelisted(urlString)` is called inside the synchronous `validateUrl` function. This function must become async:

```typescript
// Change function signature
async function validateUrl(urlString: string): Promise<{ valid: boolean; error?: string }> {
  // ... existing code ...
  // Line 20: add await
  if (!(await isRetailerWhitelisted(urlString))) {
  // ... rest stays the same ...
}
```

Also update the caller `fetchMetadata` to `await validateUrl(urlString)` (line 99 — already in an async function, just add `await`).

- [ ] **Step 2: Update `src/app/api/metadata/route.ts`**

Line 13: add `await`:
```typescript
if (!(await isRetailerWhitelisted(validatedData.url))) {
```

- [ ] **Step 3: Update `src/app/api/extension/products/route.ts`**

Line 27: add `await`:
```typescript
if (!(await isRetailerWhitelisted(data.url))) {
```

- [ ] **Step 4: Update `src/app/api/extension/whitelist/route.ts`**

Complete rewrite (it's 8 lines):
```typescript
import { NextResponse } from "next/server";
import { getWhitelistedDomains, getRetailerName } from "@/lib/retailer-whitelist";

export async function GET() {
  const domains = await getWhitelistedDomains();
  // Build the same shape the extension expects: { domains: [{ domain, name }] }
  const entries = await Promise.all(
    domains.map(async (domain) => ({
      domain,
      name: await getRetailerName(domain),
    }))
  );
  return NextResponse.json({ domains: entries });
}
```

- [ ] **Step 5: Update `src/app/api/events/[eventId]/products/route.ts`**

Line 74: add `await`:
```typescript
if (!(await isRetailerWhitelisted(validatedData.url))) {
```

Line 90: add `await`:
```typescript
const title = validatedData.title || (await getRetailerName(domain));
```

- [ ] **Step 6: Verify all API routes compile**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: Only errors from the 3 client components (Task 5). No errors from API routes.

- [ ] **Step 7: Commit**

```bash
git add src/lib/metadata.ts src/app/api/metadata/route.ts src/app/api/extension/products/route.ts src/app/api/extension/whitelist/route.ts src/app/api/events/\[eventId\]/products/route.ts
git commit -m "refactor: update API routes to use async whitelist functions"
```

---

## Task 5: Update Client Components (3 files)

**Files:**
- Modify: `src/components/products/AddProductForm.tsx`
- Modify: `src/components/products/ProductCard.tsx`
- Modify: `src/components/products/ProductListManager.tsx`

These are `"use client"` components that can't call Prisma. Solution: pass data as props from parent server components and move validation to the server.

- [ ] **Step 1: Update `AddProductForm.tsx`**

Remove the whitelist import. Accept `whitelistedDomains` as a prop. Move whitelist validation to the server (the `/api/metadata` endpoint already validates, and `/api/events/[eventId]/products` also validates — the client-side check was just a UX optimization).

Changes:
1. Remove: `import { isRetailerWhitelisted, getWhitelistedDomains } from "@/lib/retailer-whitelist";`
2. Add prop: `whitelistedDomains: string[]` to `AddProductFormProps`
3. Replace `isRetailerWhitelisted(url)` call (line 77) with a local domain check against the prop:
```typescript
const domain = (() => {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return null; }
})();
const isWhitelisted = domain && whitelistedDomains.some(
  (d) => d === domain || domain.endsWith("." + d)
);
if (!isWhitelisted) {
  setError(`This retailer is not approved. Approved retailers: ${whitelistedDomains.join(", ")}`);
  return;
}
```
4. Replace `getWhitelistedDomains()` calls (lines 78, 184) with the `whitelistedDomains` prop.

- [ ] **Step 2: Find and update the parent that renders `AddProductForm`**

Search for the parent component/page that renders `<AddProductForm`. It needs to fetch and pass `whitelistedDomains`:

Run: `grep -r "AddProductForm" src/ --include="*.tsx" -l`

In the parent, add:
```typescript
import { getWhitelistedDomains } from "@/lib/retailer-whitelist";
// In the server component or page:
const whitelistedDomains = await getWhitelistedDomains();
// Pass as prop:
<AddProductForm eventId={eventId} whitelistedDomains={whitelistedDomains} ... />
```

If the parent is also a client component, create a small wrapper server component or fetch the domains via the existing `/api/extension/whitelist` endpoint on mount.

- [ ] **Step 3: Update `ProductCard.tsx`**

Remove the whitelist import. Accept `retailerName` as a prop.

Changes:
1. Remove: `import { getRetailerName } from "@/lib/retailer-whitelist";`
2. Add `retailerName?: string` to `ProductCardProps`
3. Replace line 32: `const retailerName = getRetailerName(product.retailerDomain);` with:
```typescript
const retailerName = props.retailerName || product.retailerDomain;
```

- [ ] **Step 4: Update `ProductListManager.tsx`**

Remove the whitelist import. The component fetches products from the API — inline the domain as the display name (it's already the retailerDomain field).

Changes:
1. Remove: `import { getRetailerName } from "@/lib/retailer-whitelist";`
2. Replace `getRetailerName(product.retailerDomain)` (line 306) with `product.retailerDomain`

(This is acceptable because the ProductListManager is an admin/owner view. The public-facing ProductCard will get the proper name via prop.)

- [ ] **Step 5: Verify full project compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/products/AddProductForm.tsx src/components/products/ProductCard.tsx src/components/products/ProductListManager.tsx
git commit -m "refactor: remove direct whitelist imports from client components"
```

---

## Task 6: Discovery Script — Utility Modules

**Files:**
- Create: `src/lib/discovery/queries.ts`
- Create: `src/lib/discovery/google-search.ts`
- Create: `src/lib/discovery/israel-check.ts`
- Create: `src/lib/discovery/product-finder.ts`
- Create: `src/lib/discovery/og-scorer.ts`

Each module is small and focused. Build them bottom-up so the main script can compose them.

- [ ] **Step 1: Create `src/lib/discovery/queries.ts`**

```typescript
import { prisma } from "@/lib/prisma";

export const SEARCH_QUERIES = [
  // Hebrew — general
  "חנות אונליין ישראל",
  "קניות לבית משלוח ישראל",
  "חנות אופנה ישראל",
  "חנות רהיטים אונליין ישראל",
  "כלי מטבח קנייה אונליין ישראל",
  "מתנות לבית ישראל",
  "חנות אלקטרוניקה ישראל",
  "מוצרי תינוקות ישראל אונליין",
  "כלי בית ישראל",
  "עיצוב הבית ישראל",
  // English — general
  "buy home decor delivery Israel",
  "Israeli fashion online shop",
  "kitchenware Israel online store",
  "furniture delivery Israel online",
  "baby products Israel online shop",
  "electronics store Israel delivery",
  "bedding linens Israel online",
  "outdoor garden Israel shop",
  "gift registry Israel retailers",
  "home appliances Israel buy online",
  // English — specific categories
  "towels bedsheets Israel buy online",
  "kitchen gadgets Israel delivery",
  "living room furniture Israel",
  "bathroom accessories Israel online",
  "wedding gift ideas Israel shop",
  "tableware dinnerware Israel",
  "lighting lamps Israel online store",
  "storage organization Israel",
  "cleaning supplies Israel delivery",
  "pet supplies Israel online shop",
];

/**
 * Get queries that haven't been used recently, based on the last N batches.
 * Returns all queries sorted so least-recently-used come first.
 */
export async function getRotatedQueries(lookbackBatches = 5): Promise<string[]> {
  const recentBatches = await prisma.discoveryBatch.findMany({
    where: { status: { not: "running" } },
    orderBy: { startedAt: "desc" },
    take: lookbackBatches,
    select: { searchQueries: true },
  });

  const recentlyUsed = new Set(recentBatches.flatMap((b) => b.searchQueries));

  // Unused queries first, then recently used
  const unused = SEARCH_QUERIES.filter((q) => !recentlyUsed.has(q));
  const used = SEARCH_QUERIES.filter((q) => recentlyUsed.has(q));

  return [...unused, ...used];
}
```

- [ ] **Step 2: Create `src/lib/discovery/google-search.ts`**

```typescript
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
```

- [ ] **Step 3: Create `src/lib/discovery/israel-check.ts`**

```typescript
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
```

- [ ] **Step 4: Create `src/lib/discovery/product-finder.ts`**

```typescript
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
```

- [ ] **Step 5: Create `src/lib/discovery/og-scorer.ts`**

```typescript
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
```

- [ ] **Step 6: Commit all utility modules**

```bash
git add src/lib/discovery/
git commit -m "feat: add discovery utility modules (search, israel check, product finder, OG scorer)"
```

---

## Task 7: Discovery Script — Main Entry Point

**Files:**
- Create: `scripts/discover-retailers.ts`

- [ ] **Step 1: Create the main script**

```typescript
import { PrismaClient } from "@prisma/client";
import { getRotatedQueries } from "../src/lib/discovery/queries";
import { searchGoogle, getQueriesUsed, getRemainingQuota } from "../src/lib/discovery/google-search";
import { checkIsraelDelivery } from "../src/lib/discovery/israel-check";
import { findProductPages } from "../src/lib/discovery/product-finder";
import { scoreBestProduct } from "../src/lib/discovery/og-scorer";

// Use a fresh Prisma client (not the Next.js one) for the standalone script
const prisma = new PrismaClient();

const COOLDOWN_DAYS = 14;

async function main() {
  console.log("=== Retailer Discovery Bot ===\n");

  // Concurrency guard — also handle stale batches (>1 hour old)
  const runningBatch = await prisma.discoveryBatch.findFirst({
    where: { status: "running" },
  });
  if (runningBatch) {
    const ageMs = Date.now() - new Date(runningBatch.startedAt).getTime();
    const ONE_HOUR = 60 * 60 * 1000;
    if (ageMs > ONE_HOUR) {
      console.log(`Stale batch ${runningBatch.id} found (${Math.round(ageMs / 60000)} min old). Marking as failed.`);
      await prisma.discoveryBatch.update({
        where: { id: runningBatch.id },
        data: { status: "failed", completedAt: new Date() },
      });
    } else {
      console.error(`Another discovery run is already in progress (batch ${runningBatch.id}, started ${runningBatch.startedAt})`);
      process.exit(1);
    }
  }

  // Create batch
  const batch = await prisma.discoveryBatch.create({
    data: { status: "running", searchQueries: [] },
  });
  console.log(`Batch ${batch.id} started\n`);

  // Mark batch as failed on unexpected exit
  let batchFinalized = false;
  const cleanup = async () => {
    if (!batchFinalized) {
      console.error("\nScript interrupted. Marking batch as failed...");
      await prisma.discoveryBatch.update({
        where: { id: batch.id },
        data: { status: "failed", completedAt: new Date() },
      }).catch(() => {});
      batchFinalized = true;
    }
    await prisma.$disconnect();
    process.exit(1);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  try {
    // Load known domains
    const whitelistedDomains = (await prisma.retailerWhitelist.findMany({ select: { domain: true } }))
      .map((r) => r.domain);

    const discoveredDomains = (await prisma.discoveredRetailer.findMany({ select: { domain: true, status: true, rejectedAt: true } }));

    const cooldownCutoff = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

    const knownDomains = new Set<string>([
      ...whitelistedDomains,
      ...discoveredDomains
        .filter((d) => {
          // Skip if pending or approved
          if (d.status !== "rejected") return true;
          // Skip if rejected within cooldown
          if (d.rejectedAt && d.rejectedAt > cooldownCutoff) return true;
          // Past cooldown — allow re-discovery
          return false;
        })
        .map((d) => d.domain),
    ]);

    console.log(`Known domains: ${knownDomains.size} (${whitelistedDomains.length} whitelisted, ${discoveredDomains.length} discovered)\n`);

    // Get rotated queries
    const queries = await getRotatedQueries();
    const usedQueries: string[] = [];

    let retailersFound = 0;
    let retailersSkipped = 0;

    // Discover new domains
    const newDomains: Map<string, { url: string; title: string; query: string }> = new Map();

    for (const query of queries) {
      if (getRemainingQuota() <= 0) {
        console.log("\n[quota] API quota exhausted. Stopping discovery.\n");
        break;
      }

      console.log(`[search] "${query}" (quota: ${getRemainingQuota()} remaining)`);
      usedQueries.push(query);

      const results = await searchGoogle(query);

      for (const result of results) {
        if (knownDomains.has(result.domain)) {
          retailersSkipped++;
          continue;
        }
        if (newDomains.has(result.domain)) continue;

        newDomains.set(result.domain, {
          url: result.url,
          title: result.title,
          query,
        });
        knownDomains.add(result.domain); // prevent duplicate within this run
      }

      // Polite delay between Google queries
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log(`\n[discovery] Found ${newDomains.size} new domains to validate\n`);

    // Validate each domain
    for (const [domain, info] of newDomains) {
      if (getRemainingQuota() <= 0) {
        console.log("[quota] Saving remaining quota for next run. Stopping validation.");
        break;
      }

      console.log(`[validate] ${domain}...`);

      try {
        // Israel delivery check
        const delivery = await checkIsraelDelivery(domain);
        console.log(`  delivery: ${delivery.deliversToIsrael} ${delivery.evidence ? `(${delivery.evidence})` : ""}`);

        // Find product pages
        const productUrls = await findProductPages(domain);
        console.log(`  products: found ${productUrls.length} URLs`);

        // Score OG tags
        let bestScore = null;
        let bestUrl = "";
        if (productUrls.length > 0) {
          const result = await scoreBestProduct(productUrls);
          if (result) {
            bestScore = result.bestScore;
            bestUrl = result.bestUrl;
          }
        }

        const score = bestScore?.score ?? 0;
        const name = bestScore?.siteName || bestScore?.title?.split(/\s*[-|–]\s*/)[0] || domain;

        console.log(`  OG score: ${score}/3 | name: "${name}"`);

        // Save to DB (upsert in case of cooldown re-check)
        await prisma.discoveredRetailer.upsert({
          where: { domain },
          update: {
            name,
            batchId: batch.id,
            discoverySource: "google_search",
            searchQuery: info.query,
            hasOgTitle: bestScore?.hasOgTitle ?? false,
            hasOgImage: bestScore?.hasOgImage ?? false,
            hasOgPrice: bestScore?.hasOgPrice ?? false,
            score,
            deliversToIsrael: delivery.deliversToIsrael,
            deliveryEvidence: delivery.evidence,
            sampleProductUrl: bestUrl || null,
            sampleProductTitle: bestScore?.title || null,
            sampleImageUrl: bestScore?.imageUrl || null,
            status: "pending",
            rejectedAt: null, // reset if re-discovered
          },
          create: {
            domain,
            name,
            batchId: batch.id,
            discoverySource: "google_search",
            searchQuery: info.query,
            hasOgTitle: bestScore?.hasOgTitle ?? false,
            hasOgImage: bestScore?.hasOgImage ?? false,
            hasOgPrice: bestScore?.hasOgPrice ?? false,
            score,
            deliversToIsrael: delivery.deliversToIsrael,
            deliveryEvidence: delivery.evidence,
            sampleProductUrl: bestUrl || null,
            sampleProductTitle: bestScore?.title || null,
            sampleImageUrl: bestScore?.imageUrl || null,
            status: "pending",
          },
        });

        retailersFound++;

        // Polite delay between retailers
        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        console.error(`  [error] Failed to validate ${domain}:`, error instanceof Error ? error.message : error);
      }
    }

    // Finalize batch
    await prisma.discoveryBatch.update({
      where: { id: batch.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        retailersFound,
        retailersSkipped,
        searchQueries: usedQueries,
      },
    });
    batchFinalized = true;

    console.log(`\n=== Discovery Complete ===`);
    console.log(`Found: ${retailersFound} new retailers`);
    console.log(`Skipped: ${retailersSkipped} (already known)`);
    console.log(`API queries used: ${getQueriesUsed()}/100`);
    console.log(`Batch: ${batch.id}`);
  } catch (error) {
    // Mark batch as failed
    await prisma.discoveryBatch.update({
      where: { id: batch.id },
      data: { status: "failed", completedAt: new Date() },
    });
    batchFinalized = true;
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

- [ ] **Step 2: Add npm script**

In `package.json`, add to `"scripts"`:
```json
"discover": "npx tsx --tsconfig tsconfig.json scripts/discover-retailers.ts"
```

- [ ] **Step 3: Verify script loads without errors (dry run needs env vars)**

Run: `npx tsx scripts/discover-retailers.ts 2>&1 | head -5`
Expected: Either starts running (if env vars set) or errors about missing `GOOGLE_CSE_API_KEY` (which confirms the script loads and parses correctly).

- [ ] **Step 4: Commit**

```bash
git add scripts/discover-retailers.ts package.json
git commit -m "feat: add retailer discovery script"
```

---

## Task 8: Extract Shared Admin Auth + Discovery Endpoints

**Files:**
- Create: `src/lib/admin-auth.ts`
- Create: `src/app/api/admin/retailers/discovery/route.ts`

Note: The existing admin routes (`/api/admin/events/route.ts`) duplicate a `verifyAdmin` function. Extract it once and reuse it. The existing routes can be updated to use it later, but new routes must use the shared version.

- [ ] **Step 0: Create shared admin auth utility**

`src/lib/admin-auth.ts`:

```typescript
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Verify admin access via x-admin-key header.
 * Falls back to Supabase session + admin_key query param for browser-based admin UI.
 */
export async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const adminKey = request.headers.get("x-admin-key");
  if (adminKey === process.env.ADMIN_SECRET_KEY) return true;

  // Fallback for browser-based admin panel: check Supabase session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const queryKey = request.nextUrl.searchParams.get("admin_key");
  return queryKey === process.env.ADMIN_SECRET_KEY;
}
```

- [ ] **Step 1: Create the discovery API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// GET: List pending discoveries grouped by batch
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const batches = await prisma.discoveryBatch.findMany({
      where: {
        discoveries: { some: { status: "pending" } },
      },
      orderBy: { startedAt: "desc" },
      include: {
        discoveries: {
          where: { status: "pending" },
          orderBy: { score: "desc" },
        },
      },
    });

    return NextResponse.json({ batches });
  } catch (error) {
    console.error("Error fetching discoveries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Submit batch decisions
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const decisions: Array<{ id: string; action: "approve" | "reject" }> = body.decisions;

    if (!Array.isArray(decisions) || decisions.length === 0) {
      return NextResponse.json({ error: "No decisions provided" }, { status: 400 });
    }

    if (decisions.length > 200) {
      return NextResponse.json({ error: "Too many decisions (max 200)" }, { status: 400 });
    }

    const approved: string[] = [];
    const rejected: string[] = [];

    for (const d of decisions) {
      if (d.action === "approve") approved.push(d.id);
      else if (d.action === "reject") rejected.push(d.id);
    }

    // Execute in a transaction
    await prisma.$transaction(async (tx) => {
      // Get approved retailer details
      if (approved.length > 0) {
        const toApprove = await tx.discoveredRetailer.findMany({
          where: { id: { in: approved }, status: "pending" },
        });

        // Create whitelist entries
        for (const retailer of toApprove) {
          await tx.retailerWhitelist.upsert({
            where: { domain: retailer.domain },
            update: { name: retailer.name, isActive: true },
            create: {
              domain: retailer.domain,
              name: retailer.name,
              isActive: true,
            },
          });
        }

        // Mark as approved
        await tx.discoveredRetailer.updateMany({
          where: { id: { in: approved } },
          data: { status: "approved" },
        });
      }

      // Mark rejected
      if (rejected.length > 0) {
        await tx.discoveredRetailer.updateMany({
          where: { id: { in: rejected } },
          data: { status: "rejected", rejectedAt: new Date() },
        });
      }
    });

    return NextResponse.json({
      success: true,
      approved: approved.length,
      rejected: rejected.length,
    });
  } catch (error) {
    console.error("Error processing decisions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/admin-auth.ts src/app/api/admin/retailers/discovery/route.ts
git commit -m "feat: add shared admin auth and discovery queue API"
```

---

## Task 9: Admin API — Whitelist Management Endpoints

**Files:**
- Create: `src/app/api/admin/retailers/route.ts`
- Create: `src/app/api/admin/retailers/[id]/route.ts`

- [ ] **Step 1: Create whitelist list endpoint**

`src/app/api/admin/retailers/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 50;

    const where = query
      ? {
          OR: [
            { domain: { contains: query, mode: "insensitive" as const } },
            { name: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [retailers, total] = await Promise.all([
      prisma.retailerWhitelist.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.retailerWhitelist.count({ where }),
    ]);

    return NextResponse.json({ retailers, total, page, limit });
  } catch (error) {
    console.error("Error listing retailers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create single retailer update endpoint**

`src/app/api/admin/retailers/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (typeof body.name === "string") updateData.name = body.name;
    if (typeof body.allowedPaths === "string" || body.allowedPaths === null) {
      updateData.allowedPaths = body.allowedPaths;
    }
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const retailer = await prisma.retailerWhitelist.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ retailer });
  } catch (error) {
    console.error("Error updating retailer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/retailers/route.ts src/app/api/admin/retailers/\[id\]/route.ts
git commit -m "feat: add admin API for whitelist management"
```

---

## Task 10: Admin UI — RetailerDiscovery Component

**Files:**
- Create: `src/components/admin/RetailerDiscovery.tsx`

- [ ] **Step 1: Create the discovery queue component**

```typescript
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface DiscoveredRetailer {
  id: string;
  domain: string;
  name: string;
  score: number;
  hasOgTitle: boolean;
  hasOgImage: boolean;
  hasOgPrice: boolean;
  deliversToIsrael: string;
  deliveryEvidence: string | null;
  sampleProductUrl: string | null;
  sampleProductTitle: string | null;
  sampleImageUrl: string | null;
}

interface DiscoveryBatch {
  id: string;
  startedAt: string;
  status: string;
  searchQueries: string[];
  discoveries: DiscoveredRetailer[];
}

type Decision = "approve" | "reject" | null;

const SCORE_COLORS: Record<number, string> = {
  3: "bg-green-100 text-green-800 border-green-300",
  2: "bg-yellow-100 text-yellow-800 border-yellow-300",
  1: "bg-orange-100 text-orange-800 border-orange-300",
  0: "bg-red-100 text-red-800 border-red-300",
};

export function RetailerDiscovery() {
  const [batches, setBatches] = useState<DiscoveryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [decisions, setDecisions] = useState<Map<string, Decision>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscoveries();
  }, []);

  const fetchDiscoveries = async () => {
    try {
      const response = await fetch("/api/admin/retailers/discovery");
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error("Error fetching discoveries:", error);
    } finally {
      setLoading(false);
    }
  };

  const setDecision = (id: string, action: Decision) => {
    setDecisions((prev) => {
      const next = new Map(prev);
      if (action === null) next.delete(id);
      else next.set(id, action);
      return next;
    });
  };

  const handleSubmit = async () => {
    const entries = Array.from(decisions.entries())
      .filter(([, action]) => action !== null)
      .map(([id, action]) => ({ id, action: action! }));

    if (entries.length === 0) return;

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch("/api/admin/retailers/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions: entries }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmitResult(`Approved: ${data.approved}, Rejected: ${data.rejected}`);
        setDecisions(new Map());
        fetchDiscoveries(); // refresh
      }
    } catch (error) {
      console.error("Error submitting decisions:", error);
      setSubmitResult("Error submitting decisions");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading discoveries...</p>;

  if (batches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No pending discoveries</p>
        <p className="text-sm mt-1">Run the discovery script: <code className="bg-gray-100 px-2 py-1 rounded">npm run discover</code></p>
      </div>
    );
  }

  const totalDecisions = Array.from(decisions.values()).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {submitResult && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          {submitResult}
        </div>
      )}

      {batches.map((batch) => (
        <div key={batch.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">
                  Batch: {new Date(batch.startedAt).toLocaleDateString()}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({batch.discoveries.length} retailers)
                </span>
              </div>
              {batch.status === "failed" && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                  Partial (script failed)
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {batch.discoveries.map((retailer) => {
              const decision = decisions.get(retailer.id) || null;

              return (
                <div key={retailer.id} className="px-4 py-3 flex items-start gap-4">
                  {/* Sample image */}
                  <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                    {retailer.sampleImageUrl ? (
                      <Image
                        src={retailer.sampleImageUrl}
                        alt={retailer.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{retailer.name}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${SCORE_COLORS[retailer.score]}`}>
                        {retailer.score}/3
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${retailer.deliversToIsrael === "yes" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {retailer.deliversToIsrael === "yes" ? "Ships to IL" : "Delivery unknown"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{retailer.domain}</p>
                    {retailer.sampleProductTitle && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        Sample: {retailer.sampleProductTitle}
                      </p>
                    )}
                    {retailer.deliveryEvidence && (
                      <p className="text-xs text-gray-400 mt-0.5" title={retailer.deliveryEvidence}>
                        Evidence: {retailer.deliveryEvidence}
                      </p>
                    )}
                    {retailer.sampleProductUrl && (
                      <a
                        href={retailer.sampleProductUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline mt-0.5 inline-block"
                      >
                        View sample product
                      </a>
                    )}
                  </div>

                  {/* Approve/Reject */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setDecision(retailer.id, decision === "approve" ? null : "approve")}
                      className={`px-3 py-1 text-sm rounded border transition ${
                        decision === "approve"
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-green-700 border-green-300 hover:bg-green-50"
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setDecision(retailer.id, decision === "reject" ? null : "reject")}
                      className={`px-3 py-1 text-sm rounded border transition ${
                        decision === "reject"
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-red-700 border-red-300 hover:bg-red-50"
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Submit bar */}
      {totalDecisions > 0 && (
        <div className="sticky bottom-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            {totalDecisions} decision{totalDecisions !== 1 ? "s" : ""} ready
          </span>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {submitting ? "Submitting..." : "Submit Decisions"}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/RetailerDiscovery.tsx
git commit -m "feat: add RetailerDiscovery admin component"
```

---

## Task 11: Admin UI — RetailerWhitelist Component

**Files:**
- Create: `src/components/admin/RetailerWhitelist.tsx`

- [ ] **Step 1: Create the whitelist management component**

```typescript
"use client";

import { useState, useEffect } from "react";

interface Retailer {
  id: string;
  domain: string;
  name: string;
  allowedPaths: string | null;
  isActive: boolean;
  createdAt: string;
}

export function RetailerWhitelist() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Retailer>>({});

  useEffect(() => {
    fetchRetailers();
  }, []);

  const fetchRetailers = async (query = "") => {
    try {
      const url = query ? `/api/admin/retailers?q=${encodeURIComponent(query)}` : "/api/admin/retailers";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRetailers(data.retailers || []);
      }
    } catch (error) {
      console.error("Error fetching retailers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchRetailers(search);
  };

  const handleToggleActive = async (retailer: Retailer) => {
    try {
      const response = await fetch(`/api/admin/retailers/${retailer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !retailer.isActive }),
      });
      if (response.ok) {
        setRetailers((prev) =>
          prev.map((r) => (r.id === retailer.id ? { ...r, isActive: !r.isActive } : r))
        );
      }
    } catch (error) {
      console.error("Error toggling retailer:", error);
    }
  };

  const startEdit = (retailer: Retailer) => {
    setEditingId(retailer.id);
    setEditValues({ name: retailer.name, allowedPaths: retailer.allowedPaths });
  };

  const saveEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/retailers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      if (response.ok) {
        const data = await response.json();
        setRetailers((prev) =>
          prev.map((r) => (r.id === id ? data.retailer : r))
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error saving edit:", error);
    }
  };

  if (loading) return <p className="text-gray-500">Loading whitelist...</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search by domain or name..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <button onClick={handleSearch} className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm hover:bg-gray-200">
          Search
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Domain</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Allowed Paths</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Active</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Added</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {retailers.map((retailer) => (
              <tr key={retailer.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs">{retailer.domain}</td>
                <td className="px-4 py-2">
                  {editingId === retailer.id ? (
                    <input
                      value={editValues.name || ""}
                      onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                      className="px-2 py-1 border border-blue-300 rounded text-sm w-full"
                    />
                  ) : (
                    retailer.name
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {editingId === retailer.id ? (
                    <input
                      value={editValues.allowedPaths || ""}
                      onChange={(e) => setEditValues((v) => ({ ...v, allowedPaths: e.target.value || null }))}
                      placeholder="e.g. /he-il/"
                      className="px-2 py-1 border border-blue-300 rounded text-sm w-full"
                    />
                  ) : (
                    retailer.allowedPaths || "—"
                  )}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleToggleActive(retailer)}
                    className={`px-2 py-1 text-xs rounded ${
                      retailer.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {retailer.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {new Date(retailer.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  {editingId === retailer.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => saveEdit(retailer.id)} className="text-xs text-blue-600 hover:underline">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:underline">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(retailer)} className="text-xs text-blue-600 hover:underline">
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {retailers.length === 0 && (
        <p className="text-center text-gray-500 py-4">No retailers found</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/RetailerWhitelist.tsx
git commit -m "feat: add RetailerWhitelist admin component"
```

---

## Task 12: Admin Panel — Add Retailers Tab

**Files:**
- Modify: `src/app/[locale]/admin/page.tsx`

- [ ] **Step 1: Add the Retailers tab and sections**

Add imports at the top:
```typescript
import { RetailerDiscovery } from "@/components/admin/RetailerDiscovery";
import { RetailerWhitelist } from "@/components/admin/RetailerWhitelist";
```

Add a new tab link after the "Audit Log" tab (around line 42):
```tsx
<a
  href="#retailers"
  className="py-4 px-2 border-b-2 border-transparent hover:border-gray-300 text-gray-600 font-medium"
>
  Retailers
</a>
```

Add sections after the audit section (around line 59):
```tsx
<section id="retailers">
  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Retailer Discovery</h2>
  <RetailerDiscovery />

  <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">Whitelist Management</h2>
  <RetailerWhitelist />
</section>
```

- [ ] **Step 2: Verify admin page renders**

Run: `npm run dev`
Navigate to: `http://localhost:3000/en/admin`
Expected: 4 tabs visible, "Retailers" tab shows both discovery queue and whitelist management.

- [ ] **Step 3: Commit**

```bash
git add src/app/\[locale\]/admin/page.tsx
git commit -m "feat: add Retailers tab to admin panel"
```

---

## Task 13: Integration Verification

- [ ] **Step 1: Verify TypeScript compiles cleanly**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Verify dev server starts**

Run: `npm run dev`
Expected: No build errors.

- [ ] **Step 3: Test the whitelist refactor**

Navigate to the public event page. Products should still display with retailer names. The extension whitelist endpoint (`/api/extension/whitelist`) should return the same data as before.

- [ ] **Step 4: Verify admin panel**

Navigate to: `http://localhost:3000/en/admin`
- All 4 tabs render
- Whitelist tab shows the 15 seeded retailers
- Discovery queue shows "No pending discoveries" with the npm command hint

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration verification fixes"
```
