# Retailer Discovery Bot — Design Spec

**Date:** 2026-03-24
**Branch:** `feature/scraper-bot`
**Status:** Draft

## Problem

The registry website whitelist is manually maintained with 15 hardcoded retailers. The goal is to make the registry open to a wide selection of retailers — not just the few the developer can think of. Additionally, the whitelist lives in two places (a hardcoded TypeScript array and a Postgres table), creating a sync risk.

## Goals

1. Build a discovery bot that finds new retailers programmatically via Google search and validates them for compatibility with the registry (Israel delivery + OG tag scraping).
2. All discovered retailers go through admin approval — nothing is auto-whitelisted.
3. Refactor the hardcoded whitelist to be database-backed, eliminating the dual-source problem.
4. Add an admin UI for reviewing and approving/rejecting discovered retailers in batches.

## Non-Goals

- Scraping the entire internet — the bot works within the Google Custom Search free tier (100 queries/day).
- Headless browser rendering — simple HTTP fetches are sufficient for v1.
- AI-assisted analysis — keyword-based heuristics are sufficient for v1.
- Automatic cron scheduling — the bot is a manually callable script for now.

---

## Data Model

### New table: `discovered_retailer`

| Field              | Type          | Purpose                                                        |
| ------------------ | ------------- | -------------------------------------------------------------- |
| `id`               | CUID          | Primary key                                                    |
| `domain`           | String        | Retailer domain, e.g., "foxhome.co.il"                        |
| `name`             | String        | Best guess at retailer name (from OG/title)                    |
| `batchId`          | String (FK)   | Groups discoveries from the same run                           |
| `discoverySource`  | String        | "google_search" or "seed_list"                                 |
| `searchQuery`      | String?       | The Google query that found this retailer                      |
| `hasOgTitle`       | Boolean       | Whether og:title was found on a sample product page            |
| `hasOgImage`       | Boolean       | Whether og:image was found                                     |
| `hasOgPrice`       | Boolean       | Whether og:price:amount was found                              |
| `score`            | Int (0-3)     | Sum of the three OG booleans                                   |
| `deliversToIsrael` | Enum          | `yes` / `no` / `unknown`                                      |
| `deliveryEvidence` | String?       | What made the bot decide (e.g., "Hebrew homepage")             |
| `sampleProductUrl` | String?       | The product page URL tested                                    |
| `sampleProductTitle` | String?     | What og:title returned                                         |
| `sampleImageUrl`   | String?       | What og:image returned                                         |
| `status`           | Enum          | `pending` / `approved` / `rejected`                            |
| `rejectedAt`       | DateTime?     | When rejected — used for 14-day cooldown tracking              |
| `createdAt`        | DateTime      | When discovered                                                |
| `updatedAt`        | DateTime      | Last modification                                              |

**Indexes:** Unique on `domain` (globally — a domain can only appear once across all batches; re-discoveries update the existing record rather than creating duplicates). Index on `status`. Index on `rejectedAt`.

### New table: `discovery_batch`

| Field              | Type          | Purpose                                              |
| ------------------ | ------------- | ---------------------------------------------------- |
| `id`               | CUID          | Primary key                                          |
| `startedAt`        | DateTime      | When the script started                              |
| `completedAt`      | DateTime?     | When it finished                                     |
| `retailersFound`   | Int           | Count of new retailers discovered                    |
| `retailersSkipped` | Int           | Count of already-known or cooldown retailers         |
| `searchQueries`    | String[]      | Queries used in this run                             |
| `status`           | Enum          | `running` / `completed` / `failed`                   |

### Existing table changes

No schema changes to `retailer_whitelist` — it already has `id`, `domain`, `name`, `allowedPaths`, `isActive`, `createdAt`, `updatedAt`.

---

## Discovery Script Pipeline

**Entry point:** `npx tsx scripts/discover-retailers.ts`

### Step 1: Load state

- **Concurrency guard:** Check for any `discovery_batch` with status `running`. If one exists, abort with a message ("Another discovery run is already in progress").
- Create a new `discovery_batch` record with status `running`.
- Fetch all existing domains from `retailer_whitelist` and `discovered_retailer` to avoid re-checking.
- Fetch rejected retailers — skip any rejected less than 14 days ago. Re-check those past the cooldown window.
- Derive query rotation from the database: query `discovery_batch.searchQueries` from the last N batches to determine which queries were recently used. Pick unused queries first. No local state file needed.

### Step 2: Discover retailer domains

- **Search queries** are drawn from a predefined list covering categories and locales:
  - Hebrew: "חנות אונליין ישראל", "קניות לבית משלוח ישראל", "חנות אופנה ישראל"
  - English: "buy home decor delivery Israel", "Israeli fashion online shop", "kitchenware Israel online store"
  - Category-specific: furniture, bedding, electronics, baby, kitchen, fashion, gifts, etc.
- **Google Custom Search API** runs queries, extracts unique domains from result URLs.
- Deduplicate against known domains (whitelist + discovered + cooldown).
- **Budget:** Track remaining API quota (100/day free tier). Stop discovering when quota is exhausted.

### Step 3: Validate each new domain

For each discovered domain, sequentially with polite 500ms delays:

**3a. Israel delivery check:**

1. Fetch the homepage. Detect Hebrew by checking if >20% of non-whitespace characters in the visible `<body>` text fall in the Hebrew Unicode range (U+0590–U+05FF). If so, mark `deliversToIsrael: "yes"`, evidence: `"Hebrew homepage (X% Hebrew characters)"`.
2. Otherwise, fetch common paths: `/shipping`, `/delivery`, `/faq`, `/about`, `/help`.
3. Search page content for keywords: "Israel", "ישראל", "worldwide", "international shipping", "global delivery".
4. If found → `"yes"` with the matching evidence. If no signal → `"unknown"`.

**3b. Find product pages:**

1. Fetch `robots.txt` → find `Sitemap:` directives. Respect `Disallow` rules — do not fetch paths the site explicitly disallows for bots.
2. Parse `sitemap.xml` → filter URLs matching product patterns: paths containing `/product/`, `/p/`, `/item/`, `/shop/`, `/products/`.
3. If no sitemap or no product URLs found: Google fallback query `site:domain.com product` (costs 1 API query).
4. If still no product pages: try homepage and look for links matching product URL patterns.
5. Pick up to 3 candidate product URLs.

**3c. OG tag scoring:**

1. Fetch each product page via HTTP GET.
2. Parse HTML for meta tags: `og:title`, `og:image`, `og:price:amount` / `product:price:amount`.
3. Score = count of present tags (0, 1, 2, or 3).
4. Save the best-scoring product page as the sample (URL, title, image URL).
5. Extract retailer name from `og:site_name` or page `<title>`.

### Step 4: Save results

- Write all discovered retailers to `discovered_retailer` with status `pending`.
- Update `discovery_batch` with final counts and status `completed`.
- Update `scripts/discovery-state.json` with queries used in this run.
- Print summary to console: "Found X new retailers, Y skipped (already known), Z skipped (cooldown). API queries used: N/100."

### Error handling

- Individual retailer failures (network timeout, invalid HTML) are logged and skipped — they don't abort the batch.
- If the script crashes mid-run, already-saved retailers are preserved (each is saved individually after validation).
- The batch record is marked `failed` if the script exits abnormally (via a `process.on('exit')` handler).
- **Failed batch recovery:** Retailers saved from a failed batch remain visible in the admin discovery queue with their batch marked as `failed`. The admin can still review and approve/reject them. The next script run will not re-discover domains already present in `discovered_retailer` regardless of batch status.

---

## Whitelist Refactor

### Current state

`src/lib/retailer-whitelist.ts` exports:
- `RETAILER_WHITELIST` — hardcoded array of 15 retailers
- `extractDomain(url)` — pure URL parsing function
- `isRetailerWhitelisted(url)` — checks domain against array
- `getRetailerName(domain)` — looks up name from array
- `getWhitelistedDomains()` — returns domain strings

8 files import from this module.

### New implementation

Same file path, same export names. `extractDomain` remains a pure synchronous function. All other functions become async and read from the database via Prisma with an in-memory cache.

**Cache behavior:**
- In-memory `Map<string, { domain, name, allowedPaths, isActive }>`.
- TTL: 5 minutes. After TTL expires, next call fetches fresh data from DB.
- Cache is module-scoped — shared across requests in the same function instance.

**Subdomain matching preserved:**
- The current `isRetailerWhitelisted()` supports subdomain matching (`shop.ikea.com` matches `ikea.com` via `domain.endsWith("." + retailer.domain)`).
- The refactored version fetches the full whitelist into the in-memory cache and performs the same subdomain matching logic in application code — NOT via a SQL `WHERE domain = ?` query.

**Migration of call sites:**
- All 8 importing files need to `await` the now-async functions.
- API routes and server components already support async — straightforward change.
- **Client components** (`AddProductForm.tsx`, `ProductCard.tsx`, `ProductListManager.tsx`) cannot call Prisma directly. These are handled as follows:
  - `AddProductForm.tsx` uses `isRetailerWhitelisted()` and `getWhitelistedDomains()` — the parent server component will fetch and pass the whitelist domains as a prop. The whitelist check will use a new dedicated API route or server action.
  - `ProductCard.tsx` and `ProductListManager.tsx` use `getRetailerName()` — the parent server component will resolve retailer names and pass them as props.
- **`api/extension/whitelist/route.ts`** imports `RETAILER_WHITELIST` directly (the constant) to serve the full list to the Chrome extension. This must switch to the async `getWhitelistedDomains()` function.

**Backward compatibility:**
- Seed the existing 15 retailers from the hardcoded array into the DB if they don't already exist (migration script or updated seed).
- The `RETAILER_WHITELIST` export is replaced with a getter that throws an error pointing to the async alternatives, to catch any missed migration.

---

## Admin Panel — Retailers Tab

### New tab in `/admin`

Added as a 4th tab alongside "Event Search", "Reports", and "Audit Log".

### Discovery Queue (default sub-view)

- Lists pending `discovered_retailer` records grouped by `discovery_batch`.
- Each batch header shows: date, number of retailers, queries used.
- Each retailer card displays:
  - Domain + guessed name
  - Score badge: colored by score (green 3/3, yellow 2/3, orange 1/3, red 0/3)
  - Israel delivery: "Yes" / "Unknown" with evidence in tooltip
  - Sample product preview: og:image thumbnail + og:title + price if available
  - External link to sample product URL (opens in new tab)
  - Approve / Reject toggle
- Bottom of the batch: "Submit decisions" button.
- On submit: single API call sends all decisions. Backend writes approved retailers to `retailer_whitelist` (with `allowedPaths` defaulting to `null`, meaning all paths allowed) and marks rejected ones with `rejectedAt` in one transaction. The admin can later edit `allowedPaths` via the Whitelist Management view for retailers that need path restrictions (e.g., Keter's `/he-il/` restriction).

### Whitelist Management (sub-view)

- Table of all retailers in `retailer_whitelist`.
- Columns: domain, name, active status, date added.
- Toggle active/inactive per retailer.
- Search/filter by domain or name.

### API Endpoints

| Endpoint                            | Method | Purpose                                      | Auth               |
| ----------------------------------- | ------ | -------------------------------------------- | ------------------- |
| `/api/admin/retailers/discovery`    | GET    | List pending discoveries with batch grouping | `ADMIN_SECRET_KEY`  |
| `/api/admin/retailers/discovery`    | POST   | Submit batch decisions (approve/reject array)| `ADMIN_SECRET_KEY`  |
| `/api/admin/retailers`              | GET    | List existing whitelist (paginated)          | `ADMIN_SECRET_KEY`  |
| `/api/admin/retailers/[id]`         | PUT    | Toggle active/deactivate a retailer          | `ADMIN_SECRET_KEY`  |

---

## Environment Variables

| Variable            | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `GOOGLE_CSE_API_KEY`| Google Custom Search API key             |
| `GOOGLE_CSE_ID`     | Google Custom Search Engine ID           |

Both only needed for the discovery script. Not required for the website to run.

**Existing (assumed present):** `ADMIN_SECRET_KEY` — already used by other admin endpoints, reused here.

---

## File Changes Summary

| Action       | Path                                             | Description                                    |
| ------------ | ------------------------------------------------ | ---------------------------------------------- |
| **New**      | `prisma/schema.prisma`                           | Add `DiscoveredRetailer` + `DiscoveryBatch` models |
| **New**      | `scripts/discover-retailers.ts`                  | The discovery bot script                       |
| **Refactor** | `src/lib/retailer-whitelist.ts`                  | DB-backed with in-memory cache                 |
| **Update**   | `src/app/api/metadata/route.ts`                  | Async whitelist calls                          |
| **Update**   | `src/lib/metadata.ts`                            | Async whitelist calls                          |
| **Update**   | `src/components/products/AddProductForm.tsx`      | Move whitelist check to server action/API      |
| **Update**   | `src/components/products/ProductCard.tsx`          | Move retailer name lookup to server/prop       |
| **Update**   | `src/components/products/ProductListManager.tsx`   | Move retailer name lookup to server/prop       |
| **Update**   | `src/app/api/extension/products/route.ts`         | Async whitelist calls                          |
| **Update**   | `src/app/api/extension/whitelist/route.ts`        | Async whitelist calls                          |
| **Update**   | `src/app/api/events/[eventId]/products/route.ts`  | Async whitelist calls                          |
| **New**      | `src/app/api/admin/retailers/discovery/route.ts`  | Discovery queue API                            |
| **New**      | `src/app/api/admin/retailers/route.ts`            | Whitelist management API                       |
| **New**      | `src/app/api/admin/retailers/[id]/route.ts`       | Single retailer management API                 |
| **New**      | `src/components/admin/RetailerDiscovery.tsx`      | Discovery queue UI component                   |
| **New**      | `src/components/admin/RetailerWhitelist.tsx`      | Whitelist management UI component              |
| **Update**   | `src/app/[locale]/admin/page.tsx`                 | Add Retailers tab                              |

---

## Risks and Mitigations

| Risk                                        | Mitigation                                                        |
| ------------------------------------------- | ----------------------------------------------------------------- |
| Google CSE free tier exhausted               | Script tracks quota, stops gracefully. 100/day is enough for steady growth. |
| Retailer sites block bot requests            | Use standard User-Agent, polite delays. Skip on failure.          |
| OG tags present but low quality              | Admin reviews sample screenshots before approving.                |
| Async whitelist refactor breaks client code  | Move client-side whitelist checks to server actions/props.        |
| Cache serves stale whitelist data            | 5-minute TTL is acceptable. Admin can wait or refresh.            |
| Rejected retailers re-appear after cooldown  | By design — sites improve. Admin can reject again quickly.        |
