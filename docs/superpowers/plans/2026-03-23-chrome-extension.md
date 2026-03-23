# Chrome Extension: Add to Registry — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension that lets users add products to their registry with one click while browsing whitelisted retailer sites, plus the backend API endpoints to support it.

**Architecture:** Client-side scraping approach — the content script reads OG meta tags from the retailer page DOM and sends pre-scraped data to a new `/api/extension/products` endpoint. Auth via long-lived API tokens generated through an OAuth-style flow. Extension lives in `extension/` directory alongside the Next.js app.

**Tech Stack:** Chrome Extension Manifest V3, Next.js API routes, Prisma, Supabase Auth, Zod

**Spec:** `docs/superpowers/specs/2026-03-23-chrome-extension-design.md`

---

## File Structure

```
extension/                          # Chrome extension (separate from Next.js)
├── manifest.json                   # Manifest V3 config
├── background.js                   # Service worker — API calls, state, whitelist cache
├── content.js                      # Content script — floating button, scraping, toasts
├── content.css                     # Content script styles (shadow DOM or scoped)
├── popup.html                      # Toolbar popup shell
├── popup.js                        # Popup logic — auth status, recent additions
├── popup.css                       # Popup styles
└── icons/                          # Extension icons (16, 48, 128)
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png

src/app/api/extension/
├── products/route.ts               # POST — create product via extension token
└── whitelist/route.ts              # GET — serve retailer whitelist

src/app/api/auth/
└── extension-token/route.ts        # POST — generate extension API token

src/app/[locale]/auth/
└── extension/page.tsx              # OAuth landing page — login + redirect with token

src/lib/
├── extension-auth.ts               # Token hashing, validation helpers
└── validators.ts                   # (modify) Add extensionProductSchema
src/lib/db/
└── index.ts                        # (modify) Add ExtensionToken CRUD helpers

prisma/
└── schema.prisma                   # (modify) Add ExtensionToken model
```

---

### Task 1: ExtensionToken Prisma Model + Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add ExtensionToken model to Prisma schema**

Add after the existing Profile model relations. The token is stored as a SHA-256 hash — the raw token only exists client-side in the extension.

```prisma
model ExtensionToken {
  id         String    @id @default(cuid())
  profileId  String    @db.Uuid
  tokenHash  String    @unique
  lastUsedAt DateTime?
  createdAt  DateTime  @default(now())
  revokedAt  DateTime?

  profile    Profile   @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([profileId])
  @@map("extension_tokens")
}
```

Also add to the Profile model's relations block:

```prisma
extensionTokens ExtensionToken[]
```

- [ ] **Step 2: Generate and run migration**

Run:
```bash
npx prisma migrate dev --name add_extension_token
```

Expected: Migration creates `extension_tokens` table with columns: id, profileId, tokenHash, lastUsedAt, createdAt, revokedAt.

- [ ] **Step 3: Verify Prisma client regenerated**

Run:
```bash
npx prisma generate
```

Expected: No errors. `ExtensionToken` type available in Prisma client.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add ExtensionToken model for Chrome extension auth"
```

---

### Task 2: Extension Auth Helpers

**Files:**
- Create: `src/lib/extension-auth.ts`
- Modify: `src/lib/db/index.ts`

- [ ] **Step 1: Create extension-auth.ts with token hashing and validation**

```typescript
import "server-only";

import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export function generateExtensionToken(): { raw: string; hash: string } {
  const raw = randomUUID();
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Validates a Bearer token from the Authorization header.
 * Returns the profile ID if valid, null otherwise.
 * Updates lastUsedAt as a side effect.
 */
export async function validateExtensionToken(
  raw: string
): Promise<{ profileId: string } | null> {
  const tokenHash = hashToken(raw);

  const token = await prisma.extensionToken.findUnique({
    where: { tokenHash },
  });

  if (!token || token.revokedAt) {
    return null;
  }

  // Update lastUsedAt (fire-and-forget)
  prisma.extensionToken.update({
    where: { id: token.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return { profileId: token.profileId };
}

/**
 * Extracts Bearer token from Authorization header.
 * Returns null if header is missing or malformed.
 */
export function extractBearerToken(
  authHeader: string | null
): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
```

- [ ] **Step 2: Add ExtensionToken DB helpers to src/lib/db/index.ts**

Add at the end of the file:

```typescript
// Extension Tokens
export async function createExtensionToken(
  profileId: string,
  tokenHash: string
) {
  return prisma.extensionToken.create({
    data: { profileId, tokenHash },
  });
}

export async function revokeExtensionTokensForProfile(profileId: string) {
  return prisma.extensionToken.updateMany({
    where: { profileId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/extension-auth.ts src/lib/db/index.ts
git commit -m "feat: add extension token generation and validation helpers"
```

---

### Task 3: Zod Schema for Extension Product Creation

**Files:**
- Modify: `src/lib/validators.ts`

- [ ] **Step 1: Add extensionProductSchema**

This is similar to `productCreateSchema` but category is optional (defaults to "other") and title is required (scraped client-side):

```typescript
export const extensionProductSchema = z.object({
  url: z.string().url("Invalid URL"),
  title: z.string().min(1).max(200),
  imageUrl: z.string().url().optional(),
  estimatedPrice: z.number().positive().optional(),
});

export type ExtensionProductInput = z.infer<typeof extensionProductSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validators.ts
git commit -m "feat: add Zod schema for extension product creation"
```

---

### Task 4: GET /api/extension/whitelist Endpoint

**Files:**
- Create: `src/app/api/extension/whitelist/route.ts`

- [ ] **Step 1: Create the whitelist endpoint**

Public endpoint (no auth). Returns the retailer whitelist for the extension to cache.

```typescript
import { NextResponse } from "next/server";
import { RETAILER_WHITELIST } from "@/lib/retailer-whitelist";

export async function GET() {
  return NextResponse.json({
    domains: RETAILER_WHITELIST,
  });
}
```

- [ ] **Step 2: Verify it works**

Run:
```bash
curl http://localhost:3000/api/extension/whitelist
```

Expected: JSON with `{ domains: [{ domain: "foxhome.co.il", name: "FOX HOME" }, ...] }`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/extension/whitelist/route.ts
git commit -m "feat: add GET /api/extension/whitelist endpoint"
```

---

### Task 5: POST /api/extension/products Endpoint

**Files:**
- Create: `src/app/api/extension/products/route.ts`

- [ ] **Step 1: Create the product creation endpoint**

Authenticates via Bearer token (not Supabase cookies). Validates whitelist server-side. Checks for duplicate URLs.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateExtensionToken, extractBearerToken } from "@/lib/extension-auth";
import { createProduct } from "@/lib/db";
import { extensionProductSchema } from "@/lib/validators";
import { isRetailerWhitelisted, extractDomain } from "@/lib/retailer-whitelist";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    // Auth via Bearer token
    const raw = extractBearerToken(request.headers.get("authorization"));
    if (!raw) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = await validateExtensionToken(raw);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const data = extensionProductSchema.parse(body);

    // Validate whitelist
    if (!isRetailerWhitelisted(data.url)) {
      return NextResponse.json(
        { error: "Retailer is not whitelisted" },
        { status: 403 }
      );
    }

    const domain = extractDomain(data.url);
    if (!domain) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Find user's event (single-event model: get their first owned event)
    const ownership = await prisma.eventOwner.findFirst({
      where: { profileId: auth.profileId, role: "owner" },
      include: { event: true },
    });

    if (!ownership) {
      return NextResponse.json(
        { error: "No event found" },
        { status: 404 }
      );
    }

    const eventId = ownership.eventId;

    // Check for duplicate URL in this event
    const existing = await prisma.productLink.findFirst({
      where: {
        eventId,
        url: data.url,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Product already in registry" },
        { status: 409 }
      );
    }

    // Create the product
    const product = await createProduct(eventId, {
      eventId,
      title: data.title,
      description: undefined,
      url: data.url,
      retailerDomain: domain,
      category: "other",
      imageUrl: data.imageUrl,
      estimatedPrice: data.estimatedPrice,
      isVisible: true,
    });

    return NextResponse.json(
      {
        id: product.id,
        title: product.title,
        retailerDomain: product.retailerDomain,
        imageUrl: product.imageUrl,
        estimatedPrice: product.estimatedPrice,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.flatten().fieldErrors },
        { status: 422 }
      );
    }
    console.error("Extension product creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/extension/products/route.ts
git commit -m "feat: add POST /api/extension/products endpoint with token auth"
```

---

### Task 6: Extension Auth Flow (Token Generation + OAuth Page)

**Files:**
- Create: `src/app/api/auth/extension-token/route.ts`
- Create: `src/app/[locale]/auth/extension/page.tsx`

- [ ] **Step 1: Create POST /api/auth/extension-token endpoint**

Called after user is authenticated via Supabase. Generates a token and returns it.

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateExtensionToken } from "@/lib/extension-auth";
import { createExtensionToken } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's event
    const ownership = await prisma.eventOwner.findFirst({
      where: { profileId: user.id, role: "owner" },
      include: {
        event: {
          include: {
            _count: { select: { products: true } },
          },
        },
      },
    });

    if (!ownership) {
      return NextResponse.json(
        { error: "No event found. Create an event first." },
        { status: 404 }
      );
    }

    // Generate and store token
    const { raw, hash } = generateExtensionToken();
    await createExtensionToken(user.id, hash);

    return NextResponse.json({
      token: raw,
      event: {
        id: ownership.event.id,
        title: ownership.event.title,
        productCount: ownership.event._count.products,
      },
    });
  } catch (error) {
    console.error("Extension token generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create the OAuth landing page**

This page is opened by `chrome.identity.launchWebAuthFlow`. If the user is already logged in (Supabase session), it generates a token and redirects back. If not, it shows a login prompt.

```tsx
import { createClient } from "@/lib/supabase/server";
import { generateExtensionToken } from "@/lib/extension-auth";
import { createExtensionToken } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ExtensionAuthClient from "./ExtensionAuthClient";

export default async function ExtensionAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_uri?: string }>;
}) {
  const { redirect_uri } = await searchParams;

  if (!redirect_uri) {
    return <div>Missing redirect_uri parameter.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // User is already logged in — generate token and redirect
    const ownership = await prisma.eventOwner.findFirst({
      where: { profileId: user.id, role: "owner" },
      include: {
        event: {
          include: { _count: { select: { products: true } } },
        },
      },
    });

    if (!ownership) {
      return <div>Create an event on the registry first, then connect the extension.</div>;
    }

    const { raw, hash } = generateExtensionToken();
    await createExtensionToken(user.id, hash);

    const url = new URL(redirect_uri);
    url.searchParams.set("token", raw);
    url.searchParams.set("event_id", ownership.event.id);
    url.searchParams.set("event_title", ownership.event.title);
    url.searchParams.set("product_count", String(ownership.event._count.products));

    redirect(url.toString());
  }

  // Not logged in — show login form that redirects back here after auth
  return <ExtensionAuthClient redirectUri={redirect_uri} />;
}
```

- [ ] **Step 3: Create the client component for login**

Create `src/app/[locale]/auth/extension/ExtensionAuthClient.tsx`:

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function ExtensionAuthClient({
  redirectUri,
}: {
  redirectUri: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Reload the page — server component will now see the session and redirect
    window.location.reload();
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#111",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        width: 360,
        padding: 32,
        background: "#1a1a1a",
        borderRadius: 12,
        border: "1px solid #333",
      }}>
        <h1 style={{ color: "#e5e5e5", fontSize: 20, marginBottom: 8 }}>
          Connect Chrome Extension
        </h1>
        <p style={{ color: "#999", fontSize: 14, marginBottom: 24 }}>
          Sign in to link the extension to your registry.
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: 12,
              background: "#222",
              border: "1px solid #444",
              borderRadius: 8,
              color: "#e5e5e5",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: 16,
              background: "#222",
              border: "1px solid #444",
              borderRadius: 8,
              color: "#e5e5e5",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
          {error && (
            <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 24px",
              background: loading ? "#555" : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign in & Connect"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/extension-token/route.ts src/app/\[locale\]/auth/extension/
git commit -m "feat: add extension OAuth flow — token endpoint and auth page"
```

---

### Task 7: Chrome Extension Scaffold

**Files:**
- Create: `extension/manifest.json`
- Create: `extension/icons/` (placeholder icons)

- [ ] **Step 1: Create extension directory and manifest.json**

```json
{
  "manifest_version": 3,
  "name": "My Registry — Add Products",
  "version": "1.0.0",
  "description": "Add products to your wedding registry with one click while shopping.",
  "permissions": ["storage", "identity"],
  "host_permissions": ["https://*/*"],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["https://*/*"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

- [ ] **Step 2: Create placeholder icons**

Create simple placeholder PNGs (16x16, 48x48, 128x128) at `extension/icons/`. These can be replaced with real branded icons later. For now, generate simple colored squares using a canvas script or use any placeholder PNG.

- [ ] **Step 3: Commit**

```bash
git add extension/
git commit -m "feat: scaffold Chrome extension with Manifest V3"
```

---

### Task 8: Service Worker (background.js)

**Files:**
- Create: `extension/background.js`

- [ ] **Step 1: Create the service worker**

Handles all API communication, whitelist caching, auth state, and recent additions. This is the brain of the extension.

**Important:** Update `API_BASE` to the actual production URL before publishing. Use `http://localhost:3000` for local development.

```javascript
const API_BASE = "http://localhost:3000"; // TODO: change to production URL

// ── State helpers ──

async function getStorage(keys) {
  return chrome.storage.local.get(keys);
}

async function setStorage(data) {
  return chrome.storage.local.set(data);
}

// ── Whitelist ──

async function fetchWhitelist() {
  try {
    const res = await fetch(`${API_BASE}/api/extension/whitelist`);
    if (!res.ok) return;
    const { domains } = await res.json();
    await setStorage({ whitelist: domains, whitelistFetchedAt: Date.now() });
  } catch (e) {
    console.error("Failed to fetch whitelist:", e);
  }
}

async function getWhitelist() {
  const { whitelist, whitelistFetchedAt } = await getStorage([
    "whitelist",
    "whitelistFetchedAt",
  ]);
  // Refresh if older than 24 hours or missing
  const stale = !whitelistFetchedAt || Date.now() - whitelistFetchedAt > 86400000;
  if (stale) {
    fetchWhitelist(); // fire-and-forget refresh
  }
  return whitelist || [];
}

// ── Auth ──

async function getAuthState() {
  const { token, eventId, eventTitle, productCount } = await getStorage([
    "token",
    "eventId",
    "eventTitle",
    "productCount",
  ]);
  return { token, eventId, eventTitle, productCount };
}

async function signOut() {
  await chrome.storage.local.remove([
    "token",
    "eventId",
    "eventTitle",
    "productCount",
    "recentAdditions",
  ]);
}

// ── API calls ──

async function addProduct(data) {
  const { token } = await getAuthState();
  if (!token) {
    return { error: "not_authenticated" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/extension/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (res.status === 401) {
      await signOut();
      return { error: "token_expired" };
    }
    if (res.status === 409) {
      return { error: "duplicate" };
    }
    if (res.status === 403) {
      return { error: "not_whitelisted" };
    }
    if (res.status === 429) {
      return { error: "rate_limited" };
    }
    if (!res.ok) {
      return { error: "server_error" };
    }

    const product = await res.json();

    // Add to recent additions cache
    const { recentAdditions = [] } = await getStorage(["recentAdditions"]);
    recentAdditions.unshift({
      ...product,
      addedAt: Date.now(),
    });
    // Keep only last 20
    await setStorage({
      recentAdditions: recentAdditions.slice(0, 20),
    });

    return { success: true, product };
  } catch (e) {
    if (!navigator.onLine) {
      return { error: "offline" };
    }
    return { error: "network_error" };
  }
}

// ── Message handling ──

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_WHITELIST") {
    getWhitelist().then(sendResponse);
    return true; // async
  }

  if (message.type === "GET_AUTH_STATE") {
    getAuthState().then(sendResponse);
    return true;
  }

  if (message.type === "ADD_PRODUCT") {
    addProduct(message.data).then(sendResponse);
    return true;
  }

  if (message.type === "SIGN_OUT") {
    signOut().then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.type === "GET_RECENT_ADDITIONS") {
    getStorage(["recentAdditions"]).then(({ recentAdditions = [] }) => {
      sendResponse(recentAdditions);
    });
    return true;
  }
});

// ── Install / startup ──

chrome.runtime.onInstalled.addListener(() => {
  fetchWhitelist();
});
```

- [ ] **Step 2: Commit**

```bash
git add extension/background.js
git commit -m "feat: add service worker — API calls, whitelist cache, auth state"
```

---

### Task 9: Content Script (Floating Button + Scraping + Toasts)

**Files:**
- Create: `extension/content.js`
- Create: `extension/content.css`

- [ ] **Step 1: Create content.css**

Styles for the floating button and toast notifications. All classes prefixed with `registry-ext-` to avoid collisions with retailer page styles.

```css
.registry-ext-fab {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 999999;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: none;
  border-radius: 24px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
  line-height: 1;
}

.registry-ext-fab:hover {
  transform: translateY(-1px);
}

.registry-ext-fab:active {
  transform: translateY(0);
}

.registry-ext-fab--active {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.registry-ext-fab--disabled {
  background: #444;
  color: #999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.registry-ext-fab--loading {
  opacity: 0.7;
  pointer-events: none;
}

.registry-ext-fab__icon {
  font-size: 16px;
  line-height: 1;
}

/* Toast */
.registry-ext-toast {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1000000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  animation: registry-ext-slide-in 0.3s ease-out;
  transition: opacity 0.3s;
}

.registry-ext-toast--success {
  background: #065f46;
  border: 1px solid #34d399;
  color: #d1fae5;
}

.registry-ext-toast--error {
  background: #7c2d12;
  border: 1px solid #f97316;
  color: #fed7aa;
}

.registry-ext-toast--info {
  background: #1e1b4b;
  border: 1px solid #818cf8;
  color: #c7d2fe;
}

.registry-ext-toast--unsupported {
  background: #44403c;
  border: 1px solid #a8a29e;
  color: #e7e5e4;
}

.registry-ext-toast__link {
  color: #8b5cf6;
  text-decoration: underline;
  cursor: pointer;
  margin-left: 4px;
}

@keyframes registry-ext-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

- [ ] **Step 2: Create content.js**

```javascript
(function () {
  // Don't inject on our own site
  if (window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("your-registry-domain.com")) {
    return;
  }

  let whitelist = [];
  let isWhitelisted = false;

  // ── Scraping ──

  function scrapeProductMeta() {
    const getMeta = (property) => {
      const el =
        document.querySelector(`meta[property="${property}"]`) ||
        document.querySelector(`meta[name="${property}"]`);
      return el?.getAttribute("content") || null;
    };

    const title =
      getMeta("og:title") ||
      document.title?.replace(/\s*[\|–—]\s*[^|–—]+$/, "").trim() ||
      null;

    const imageUrl = getMeta("og:image") || null;

    const priceStr =
      getMeta("og:price:amount") ||
      getMeta("product:price:amount") ||
      null;
    const estimatedPrice = priceStr ? Math.round(parseFloat(priceStr)) : undefined;

    return {
      url: window.location.href,
      title,
      imageUrl: imageUrl || undefined,
      estimatedPrice: estimatedPrice || undefined,
    };
  }

  // ── Toast ──

  let activeToast = null;

  function showToast(type, message, link) {
    if (activeToast) {
      activeToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = `registry-ext-toast registry-ext-toast--${type}`;

    const icons = { success: "\u2713", error: "!", info: "\u2605", unsupported: "\u2022" };
    toast.innerHTML = `<span>${icons[type] || ""}</span><span>${message}</span>`;

    if (link) {
      const a = document.createElement("a");
      a.className = "registry-ext-toast__link";
      a.textContent = link.text;
      a.href = link.url;
      a.target = "_blank";
      a.rel = "noopener";
      toast.appendChild(a);
    }

    document.body.appendChild(toast);
    activeToast = toast;

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
      if (activeToast === toast) activeToast = null;
    }, 3000);
  }

  // ── Floating Button ──

  function createButton(whitelisted) {
    const btn = document.createElement("button");
    btn.className = `registry-ext-fab ${
      whitelisted ? "registry-ext-fab--active" : "registry-ext-fab--disabled"
    }`;
    btn.innerHTML = `<span class="registry-ext-fab__icon">+</span> Add to Registry`;
    btn.addEventListener("click", handleClick);
    document.body.appendChild(btn);
    return btn;
  }

  async function handleClick() {
    // Check auth
    const auth = await chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" });
    if (!auth?.token) {
      // Open the popup for sign-in
      showToast("error", "Sign in first — click the extension icon in your toolbar.");
      return;
    }

    if (!isWhitelisted) {
      showToast("unsupported", "This store isn't supported yet.", {
        text: "Request it \u2192",
        url: `${getApiBase()}/whitelist-request`,
      });
      return;
    }

    // Scrape
    const data = scrapeProductMeta();
    if (!data.title) {
      showToast("error", "Navigate to a product page to add it.");
      return;
    }

    // Set loading state
    const btn = document.querySelector(".registry-ext-fab");
    if (btn) btn.classList.add("registry-ext-fab--loading");

    // Send to background
    const result = await chrome.runtime.sendMessage({
      type: "ADD_PRODUCT",
      data,
    });

    if (btn) btn.classList.remove("registry-ext-fab--loading");

    if (result.success) {
      showToast("success", "Added to registry!");
    } else if (result.error === "duplicate") {
      showToast("info", "Already in your registry.");
    } else if (result.error === "not_authenticated" || result.error === "token_expired") {
      showToast("error", "Sign in again — click the extension icon.");
    } else if (result.error === "offline") {
      showToast("error", "You're offline \u2014 try again later.");
    } else if (result.error === "rate_limited") {
      showToast("error", "Slow down \u2014 try again in a moment.");
    } else {
      showToast("error", "Something went wrong \u2014 try again.");
    }
  }

  function getApiBase() {
    // In production, replace with actual URL
    return "http://localhost:3000";
  }

  // ── Domain matching ──

  function isDomainMatch(hostname, whitelistDomain) {
    const clean = hostname.toLowerCase().replace(/^www\./, "");
    return clean === whitelistDomain || clean.endsWith("." + whitelistDomain);
  }

  // ── Init ──

  async function init() {
    whitelist = await chrome.runtime.sendMessage({ type: "GET_WHITELIST" });
    if (!whitelist || !Array.isArray(whitelist)) {
      whitelist = [];
    }

    const hostname = window.location.hostname;
    isWhitelisted = whitelist.some((r) => isDomainMatch(hostname, r.domain));

    // Show button on whitelisted sites, or on sites that look like they have products
    if (isWhitelisted) {
      createButton(true);
    } else {
      // Check if page has product-like OG tags
      const hasProductMeta =
        document.querySelector('meta[property="og:price:amount"]') ||
        document.querySelector('meta[property="product:price:amount"]') ||
        document.querySelector('meta[property="og:type"][content="product"]');
      if (hasProductMeta) {
        createButton(false);
      }
    }
  }

  init();
})();
```

- [ ] **Step 3: Commit**

```bash
git add extension/content.js extension/content.css
git commit -m "feat: add content script — floating button, OG scraping, toasts"
```

---

### Task 10: Popup UI

**Files:**
- Create: `extension/popup.html`
- Create: `extension/popup.css`
- Create: `extension/popup.js`

- [ ] **Step 1: Create popup.html**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="app">
    <!-- Signed-in view -->
    <div id="signed-in" style="display: none;">
      <div class="header">
        <span class="header-title">My Registry</span>
        <button id="sign-out-btn" class="header-link">Sign out</button>
      </div>
      <div class="user-section">
        <div class="avatar" id="avatar">?</div>
        <div>
          <div class="event-title" id="event-title">—</div>
          <div class="event-meta" id="event-meta">—</div>
        </div>
      </div>
      <div class="section-label">Recently added</div>
      <div id="recent-list" class="recent-list">
        <div class="empty-state">No products added yet.</div>
      </div>
      <div class="footer">
        <a id="dashboard-link" class="footer-link" target="_blank">Open Dashboard →</a>
      </div>
    </div>

    <!-- Signed-out view -->
    <div id="signed-out" style="display: none;">
      <div class="header">
        <span class="header-title">My Registry</span>
      </div>
      <div class="signed-out-body">
        <div class="signed-out-icon">🎁</div>
        <div class="signed-out-title">Add products while you shop</div>
        <div class="signed-out-desc">
          Sign in to start adding products to your wedding registry from any supported store.
        </div>
        <button id="sign-in-btn" class="sign-in-btn">Sign in to your registry</button>
      </div>
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create popup.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 320px;
  background: #111;
  color: #e5e5e5;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
}

.header {
  padding: 14px 16px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-weight: bold;
  font-size: 14px;
}

.header-link {
  background: none;
  border: none;
  color: #8b5cf6;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.user-section {
  padding: 10px 16px;
  border-bottom: 1px solid #222;
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #8b5cf6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.event-title {
  color: #ccc;
  font-size: 13px;
}

.event-meta {
  color: #666;
  font-size: 11px;
}

.section-label {
  padding: 8px 16px 4px;
  color: #666;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recent-list {
  padding: 0 16px 8px;
  max-height: 260px;
  overflow-y: auto;
}

.recent-item {
  padding: 8px 0;
  border-bottom: 1px solid #1a1a1a;
  display: flex;
  gap: 10px;
  align-items: center;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-thumb {
  width: 36px;
  height: 36px;
  background: #2a2a3e;
  border-radius: 4px;
  flex-shrink: 0;
  object-fit: cover;
}

.recent-info {
  flex: 1;
  min-width: 0;
}

.recent-title {
  color: #ccc;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-detail {
  color: #666;
  font-size: 11px;
}

.recent-time {
  color: #666;
  font-size: 10px;
  flex-shrink: 0;
}

.empty-state {
  color: #555;
  padding: 16px 0;
  text-align: center;
  font-size: 12px;
}

.footer {
  padding: 10px 16px;
  border-top: 1px solid #333;
  text-align: center;
}

.footer-link {
  color: #8b5cf6;
  font-size: 12px;
  text-decoration: none;
}

/* Signed out */
.signed-out-body {
  padding: 32px 24px;
  text-align: center;
}

.signed-out-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.signed-out-title {
  color: #ccc;
  font-size: 14px;
  margin-bottom: 6px;
}

.signed-out-desc {
  color: #666;
  font-size: 12px;
  margin-bottom: 20px;
  line-height: 1.4;
}

.sign-in-btn {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.sign-in-btn:hover {
  opacity: 0.9;
}
```

- [ ] **Step 3: Create popup.js**

```javascript
const API_BASE = "http://localhost:3000"; // TODO: change to production URL

document.addEventListener("DOMContentLoaded", async () => {
  const auth = await chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" });

  if (auth?.token) {
    showSignedIn(auth);
  } else {
    showSignedOut();
  }
});

function showSignedIn(auth) {
  document.getElementById("signed-in").style.display = "block";
  document.getElementById("signed-out").style.display = "none";

  // Set event info
  const title = auth.eventTitle || "My Registry";
  document.getElementById("event-title").textContent = title;
  document.getElementById("event-meta").textContent =
    `${auth.productCount ?? "—"} products`;
  document.getElementById("avatar").textContent =
    title.charAt(0).toUpperCase();
  document.getElementById("dashboard-link").href = API_BASE;

  // Load recent additions
  loadRecentAdditions();

  // Sign out handler
  document.getElementById("sign-out-btn").addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "SIGN_OUT" });
    showSignedOut();
  });
}

function showSignedOut() {
  document.getElementById("signed-in").style.display = "none";
  document.getElementById("signed-out").style.display = "block";

  document.getElementById("sign-in-btn").addEventListener("click", () => {
    const redirectUri = chrome.identity.getRedirectURL("callback");
    const authUrl =
      `${API_BASE}/en/auth/extension?redirect_uri=${encodeURIComponent(redirectUri)}`;

    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (responseUrl) => {
        if (chrome.runtime.lastError || !responseUrl) {
          console.error("Auth failed:", chrome.runtime.lastError);
          return;
        }

        const url = new URL(responseUrl);
        const token = url.searchParams.get("token");
        const eventId = url.searchParams.get("event_id");
        const eventTitle = url.searchParams.get("event_title");
        const productCount = parseInt(url.searchParams.get("product_count") || "0", 10);

        if (token) {
          chrome.storage.local.set(
            { token, eventId, eventTitle, productCount },
            () => {
              showSignedIn({ token, eventId, eventTitle, productCount });
            }
          );
        }
      }
    );
  });
}

async function loadRecentAdditions() {
  const items = await chrome.runtime.sendMessage({ type: "GET_RECENT_ADDITIONS" });
  const container = document.getElementById("recent-list");

  if (!items || items.length === 0) {
    container.innerHTML = '<div class="empty-state">No products added yet.</div>';
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const timeAgo = formatTimeAgo(item.addedAt);
      const thumb = item.imageUrl
        ? `<img class="recent-thumb" src="${escapeHtml(item.imageUrl)}" alt="">`
        : '<div class="recent-thumb"></div>';
      const price = item.estimatedPrice ? ` · ₪${item.estimatedPrice}` : "";

      return `
        <div class="recent-item">
          ${thumb}
          <div class="recent-info">
            <div class="recent-title">${escapeHtml(item.title)}</div>
            <div class="recent-detail">${escapeHtml(item.retailerDomain)}${price}</div>
          </div>
          <div class="recent-time">${timeAgo}</div>
        </div>
      `;
    })
    .join("");
}

function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
```

- [ ] **Step 4: Commit**

```bash
git add extension/popup.html extension/popup.css extension/popup.js
git commit -m "feat: add popup UI — auth status, recent additions, sign-in flow"
```

---

### Task 11: Integration Testing & Polish

- [ ] **Step 1: Load the extension in Chrome**

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `extension/` directory
4. Note the extension ID from the card

- [ ] **Step 2: Start the dev server and test the whitelist endpoint**

Run: `npm run dev`

Test: Navigate to `http://localhost:3000/api/extension/whitelist` — should return the retailer list.

- [ ] **Step 3: Test the content script on a whitelisted retailer**

Navigate to `https://www.ikea.com` (or any whitelisted retailer). Verify:
- Purple floating button appears in bottom-right
- Clicking it while not signed in shows error toast

- [ ] **Step 4: Test auth flow**

Click the extension icon in toolbar → click "Sign in" → verify the auth page opens → log in → verify token is stored and popup shows signed-in state.

- [ ] **Step 5: Test adding a product**

Navigate to a product page on a whitelisted retailer. Click the floating button. Verify:
- Toast says "Added to registry!"
- Product appears in the popup's recent additions
- Product appears on the registry dashboard after refresh

- [ ] **Step 6: Test error states**

- Navigate to a non-whitelisted retailer → verify grey button + "not supported" toast
- Try adding the same product again → verify "Already in your registry" toast
- Navigate to a non-product page (retailer homepage) → verify appropriate toast

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete Chrome extension v1 — add to registry while shopping"
```
