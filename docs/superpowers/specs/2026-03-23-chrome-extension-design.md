# Chrome Extension: Add to Registry

**Date:** 2026-03-23
**Status:** Draft

## Problem

Users currently add products to their registry by copying URLs one at a time from retailer websites, pasting them into the registry dashboard form, waiting for metadata scraping, optionally editing metadata, and submitting. This flow breaks the shopping experience and creates friction that discourages adding products.

## Solution

A Chrome extension that lets users add products to their registry with a single click while browsing whitelisted retailer websites. A floating "Add to Registry" button appears on supported retailer pages. Clicking it scrapes product metadata from the page DOM and sends it to the backend API. A toast confirms the add. No preview, no category picker, no extra steps.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Trigger mechanism | Floating button overlay (bottom-right) | Most discoverable; no toolbar interaction needed |
| Add flow | Instant add, toast confirmation | Keeps user in shopping flow; no friction |
| Event selection | None — one user = one event | System is moving to single-event model |
| Authentication | OAuth popup (opens registry site login → returns API token) | Standard, robust, no cookie sharing issues |
| Non-product pages | Error toast: "Navigate to a product page" | Simple, honest feedback |
| Non-whitelisted retailers | Button visible but blocked; "This store isn't supported yet" + request link | Drives retailer request feedback |
| Product category | Skipped — defaults to "other" | User can categorize later on dashboard |
| Toolbar popup | Recent additions list + auth status | Gives confidence that adds are working |
| Scraping approach | Client-side (extension reads OG tags from DOM) | Page is already loaded; avoids server round trip; faster |
| Token persistence | `chrome.storage.local` (survives restarts) | No re-login needed |

## Architecture

### Extension Components (Manifest V3)

**Content Script** — Injected into retailer pages via `matches` in manifest.
- Checks if current domain is in cached whitelist
- Renders floating "Add to Registry" button (bottom-right corner)
- On whitelisted product page click: reads OG meta tags (`og:title`, `og:image`, `og:price:amount`) from `document.head`, falls back to `<title>` tag
- Sends scraped data to service worker via `chrome.runtime.sendMessage`
- Renders toast notifications for all outcomes (success, error, duplicate, unsupported)
- On non-whitelisted domain: shows grey button, clicking shows "not supported" toast with link to whitelist request form

**Service Worker** (background, Manifest V3) — Handles all network and state.
- Stores API token in `chrome.storage.local`
- Makes authenticated API calls to registry backend
- Maintains recent additions cache (last 20 items) in `chrome.storage.local`
- Fetches and caches retailer whitelist on install and periodically (daily)
- Provides whitelist to content scripts via message passing

**Popup** — Toolbar icon click UI (320px wide).
- Signed-in state: user's event name, product count, recent additions list (thumbnail, title, retailer, price, relative timestamp), "Open Dashboard" link, sign-out button
- Signed-out state: branding, description, "Sign in to your registry" button

### New Backend Endpoints

All new routes live under `/api/extension/` to keep them grouped and separately rate-limitable.

**`POST /api/auth/extension-token`**
- Called during OAuth callback
- Validates existing Supabase session
- Generates a random API token (crypto.randomUUID, stored hashed)
- Creates `ExtensionToken` record linked to user profile
- Returns `{ token, event: { id, title, productCount } }`

**`POST /api/extension/products`**
- Accepts: `{ url, title, imageUrl?, estimatedPrice? }`
- Auth: `Authorization: Bearer <token>` header
- Validates: token is valid and not revoked, URL domain is in whitelist, URL is not a duplicate for this event
- Extracts `retailerDomain` from URL
- Creates `ProductLink` with `category: "other"`, `isVisible: true`
- Returns: `{ id, title, retailerDomain, imageUrl, estimatedPrice }`
- Error responses: 401 (bad token), 403 (not whitelisted domain), 409 (duplicate URL), 422 (invalid data), 429 (rate limited)

**`GET /api/extension/whitelist`**
- Public (no auth required)
- Returns: `{ domains: [{ domain: "foxhome.co.il", name: "FOX HOME" }, ...] }`
- Extension fetches this on install and caches it; refreshes daily

### Existing Endpoints Reused

- `POST /api/whitelist-request` — "Request this store" flow from extension toast link (opens in new tab)
- Price refresh cron (`/api/cron/refresh-prices`) — automatically covers products added via extension since they're standard `ProductLink` records

### Data Model Changes

One new Prisma model:

```prisma
model ExtensionToken {
  id         String    @id @default(cuid())
  profileId  String
  tokenHash  String    @unique
  lastUsedAt DateTime?
  createdAt  DateTime  @default(now())
  revokedAt  DateTime?

  profile    Profile   @relation(fields: [profileId], references: [id], onDelete: Cascade)
}
```

No changes to `ProductLink` or any other existing model. Products added via extension are identical to those added via the web form.

### Auth Flow (detailed)

1. User clicks "Sign in" in extension popup
2. Popup calls `chrome.identity.launchWebAuthFlow` with URL: `https://yoursite.com/auth/extension?redirect_uri=<extension-callback-url>`
3. Registry site shows login page (or recognizes existing Supabase session)
4. After successful auth, server generates token, creates `ExtensionToken` record
5. Server redirects to `<redirect_uri>?token=<token>&event_id=<id>&event_title=<title>`
6. Extension extracts token from redirect URL, stores in `chrome.storage.local`
7. All subsequent API calls include `Authorization: Bearer <token>`

Token is long-lived (no expiry by default). Revoked on: explicit sign-out from extension, password change, account deletion.

## Content Script Behavior (detailed)

### Page load sequence
1. Content script runs on all pages (broad match, `<all_urls>`)
2. Requests whitelist from service worker (cached in memory)
3. Checks current `window.location.hostname` against whitelist domains (including subdomains like `www.foxhome.co.il`)
4. If whitelisted: injects purple floating button
5. If not whitelisted but is a retailer-like page (heuristic: has product schema or OG product tags): injects grey floating button
6. Otherwise: does nothing

### Product detection (on button click)
Scrapes in this priority order:
1. `og:title` → title
2. `og:image` → imageUrl
3. `og:price:amount` or `product:price:amount` → estimatedPrice
4. Fallback: `document.title` → title (strips site name suffix like " | FOX HOME")

Minimum requirement to proceed: a valid URL + at least a title. If no title can be scraped, shows error toast.

### Floating button positioning
- Fixed position, bottom-right corner, 16px margin
- Z-index high enough to float above retailer page content (999999)
- Shadow for visibility against any background
- Small enough not to obstruct page content (pill-shaped, ~150px wide)

## Error Handling

| Scenario | Detection | User-facing behavior |
|----------|-----------|---------------------|
| Not authenticated | No token in storage | Floating button click opens popup with sign-in prompt |
| Token expired/revoked | API returns 401 | Extension clears token, shows "Sign in again" in popup, floating button becomes inactive |
| Network offline | `navigator.onLine` or fetch failure | Toast: "You're offline — try again later" |
| No OG tags / no title | Scraping returns empty | Toast: "Navigate to a product page to add it" |
| Duplicate product URL | API returns 409 | Toast: "Already in your registry" (purple/info style) |
| Rate limited | API returns 429 | Toast: "Slow down — try again in a moment" |
| Non-whitelisted domain | Domain not in cached whitelist | Grey button; toast: "This store isn't supported yet" + request link |
| Server error | API returns 500 | Toast: "Something went wrong — try again" |

## Extension Manifest (key fields)

```json
{
  "manifest_version": 3,
  "name": "My Registry — Add Products",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://*/*"],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  },
  "content_scripts": [{
    "matches": ["https://*/*"],
    "js": ["content.js"],
    "css": ["content.css"],
    "run_at": "document_idle"
  }]
}
```

Note: `host_permissions` is broad (`https://*/*`) so the content script can run on all sites and show the grey "not supported" button on non-whitelisted retailers. The extension only makes API calls to the registry backend domain.

## UI Design

### Floating Button
- Pill shape, purple gradient (`#8b5cf6` → `#6d28d9`) on whitelisted sites
- Grey (`#444`) on non-whitelisted sites
- Text: "+ Add to Registry"
- Bottom-right fixed position, 16px margin
- Box shadow for depth: `0 4px 12px rgba(139,92,246,0.4)`

### Toast Notifications
- Slide in from top-right, auto-dismiss after 3 seconds
- Success (green): "Added to registry!" with checkmark
- Error (orange): "Navigate to a product page" with warning icon
- Duplicate (blue): "Already in your registry" with star icon
- Unsupported (grey): "This store isn't supported yet" with "Request it →" link

### Toolbar Popup (320px wide)
- Dark theme (#111 background) matching extension conventions
- Header: "My Registry" title + sign-out link
- User section: avatar initial, event title, product count
- Recent additions: thumbnail (36px), title (truncated), retailer name + price, relative time
- Footer: "Open Dashboard →" link
- Signed-out state: gift emoji, description, purple "Sign in" button

## Scope Exclusions

These are explicitly out of scope for v1:
- Multiple event support (system moving to single-event)
- Product editing from within the extension
- Category selection in the extension
- Bulk add / "add all products on this page"
- Firefox or Safari versions
- Offline queue (retry failed adds when back online)
- Real-time dashboard updates (WebSocket) when products are added via extension
- Custom scraping rules per retailer (OG tags only for v1)

## Security Considerations

- API tokens are stored hashed (SHA-256) in the database; raw token only exists in `chrome.storage.local`
- `chrome.storage.local` is sandboxed per-extension and not accessible to web pages
- All API calls over HTTPS
- Server validates whitelist domain on every product create (client-side whitelist is a UX optimization, not a security boundary)
- Rate limiting on `/api/extension/products` to prevent abuse
- Token revocation on password change and account deletion via cascade
- Content script does not inject into the registry website itself (exclude own domain)
