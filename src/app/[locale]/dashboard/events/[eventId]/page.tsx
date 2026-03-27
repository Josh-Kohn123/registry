"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { EventWithOwners } from "@/types/event";
import { createClient } from "@/lib/supabase/client";
import {
  RECOMMENDED_PRODUCTS,
  RECOMMENDED_CATEGORY_ORDER,
} from "@/data/recommended-products";
import { isRetailerWhitelisted, getWhitelistedDomains } from "@/lib/retailer-whitelist";
import { FetchedMetadata, PRODUCT_CATEGORIES, ProductCategory } from "@/types/product";

/* ── helpers ──────────────────────────────────────────────────── */

function decodeHtml(str: string): string {
  return str
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/* ── types ────────────────────────────────────────────────────── */

interface Product {
  id: string;
  title: string;
  url: string;
  retailerDomain: string;
  imageUrl?: string;
  estimatedPrice?: number;
  isVisible: boolean;
  position?: number;
}

const CAT_LABELS_EN: Record<string, string> = {
  kitchen: "Kitchen", bedroom: "Bedroom", bathroom: "Bathroom",
  "living-room": "Living Room", decor: "Decor", electronics: "Electronics",
};
const CAT_LABELS_HE: Record<string, string> = {
  kitchen: "מטבח", bedroom: "חדר שינה", bathroom: "חדר אמבטיה",
  "living-room": "סלון", decor: "עיצוב", electronics: "אלקטרוניקה",
};

/* ═══════════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════════ */

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "he";

  const [event, setEvent] = useState<EventWithOwners | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAllGifts, setShowAllGifts] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { router.push("/login"); return; }
      try {
        const [eventRes, productsRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/events/${eventId}/products`),
        ]);
        if (eventRes.ok) setEvent(await eventRes.json());
        else { router.push("/dashboard"); return; }
        if (productsRes.ok) setProducts(await productsRes.json());
      } catch { router.push("/dashboard"); }
      setIsLoading(false);
    });
  }, [router, eventId]);

  const refreshProducts = async () => {
    const res = await fetch(`/api/events/${eventId}/products`);
    if (res.ok) setProducts(await res.json());
  };

  const handleRemoveProduct = async (productId: string) => {
    await fetch(`/api/events/${eventId}/products/${productId}`, { method: "DELETE" });
    refreshProducts();
  };

  const handlePublishToggle = async () => {
    if (!event) return;
    try {
      setIsPublishing(true);
      const res = await fetch(`/api/events/${eventId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !event.isPublished }),
      });
      if (res.ok) setEvent(await res.json());
    } catch { alert(locale === "he" ? "שגיאה" : "Error"); }
    finally { setIsPublishing(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(locale === "he" ? "למחוק את הרשם?" : "Delete this registry?")) return;
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard");
    } catch { alert(locale === "he" ? "שגיאה" : "Error"); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-cream">
      <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  );
  if (!event) return null;

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/events/${event.slug}`;
  const visibleProducts = products.filter((p) => p.isVisible);
  const previewProducts = visibleProducts.slice(0, 9);

  return (
    <div className={`min-h-screen bg-cream ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* ── Header ── */}
        <div className={`flex items-start justify-between gap-4 mb-8 ${isRtl ? "flex-row-reverse" : ""}`}>
          <div>
            <h1 className="font-display text-4xl font-normal text-ink leading-tight">
              {event.title}
            </h1>
            {event.eventDate && (
              <p className="text-pebble text-sm mt-1.5">
                {new Date(event.eventDate).toLocaleDateString(
                  locale === "he" ? "he-IL" : "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => router.push(`/dashboard/events/${event.id}/edit`)}
            className="text-sm text-pebble hover:text-ink transition-colors shrink-0 mt-1"
          >
            {locale === "he" ? "עריכה" : "Edit details"}
          </button>
        </div>

        {/* ── Two-column body ── */}
        <div className={`flex flex-col lg:flex-row gap-6 items-start ${isRtl ? "lg:flex-row-reverse" : ""}`}>

          {/* ── Left: Share + links ── */}
          <div className="w-full lg:w-[52%] space-y-4 lg:sticky lg:top-6">

            {/* Share card */}
            <div className="card p-6 space-y-5">
              <div className={`flex items-start justify-between gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                <div>
                  <p className="font-semibold text-ink">
                    {event.isPublished
                      ? (isRtl ? "הרשם פעיל" : "Your registry is live")
                      : (isRtl ? "הרשם בטיוטה" : "Your registry is a draft")}
                  </p>
                  <p className="text-pebble text-sm mt-0.5">
                    {event.isPublished
                      ? (isRtl ? "אורחים יכולים לראות ולהזמין" : "Guests can view and reserve gifts")
                      : (isRtl ? "אורחים לא יכולים לראות עדיין" : "Guests can't see it yet")}
                  </p>
                </div>
                <Button onClick={handlePublishToggle} isLoading={isPublishing}
                  variant={event.isPublished ? "outline" : "primary"} size="sm">
                  {event.isPublished ? (isRtl ? "השבת" : "Unpublish") : (isRtl ? "פרסם" : "Go live")}
                </Button>
              </div>

              <div className={`flex gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                <input type="text" value={publicUrl} readOnly dir="ltr"
                  className="flex-1 min-w-0 border border-warm-border bg-warm-white rounded-lg px-3 py-2.5 text-sm text-ink-mid focus:outline-none" />
                <button onClick={handleCopyLink}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    copied ? "bg-green-50 text-green-700 border border-green-200" : "bg-ink text-cream hover:opacity-80"
                  }`}>
                  {copied ? (isRtl ? "✓ הועתק" : "✓ Copied") : (isRtl ? "העתק" : "Copy link")}
                </button>
              </div>

              <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                className="inline-block text-xs text-brand hover:text-brand-dark transition-colors">
                {isRtl ? "↗ פתח עמוד הרשם" : "↗ Open your registry page"}
              </a>
            </div>

            {/* Nav links */}
            <div className="card p-5">
              {[
                { href: `/dashboard/events/${event.id}/reservations`, label: isRtl ? "הזמנות אורחים" : "Guest reservations", desc: isRtl ? "ראו מה האורחים שלכם בחרו לקנות" : "See which gifts your guests have claimed" },
                { href: `/dashboard/events/${event.id}/funds`,        label: isRtl ? "קרנות כספיות" : "Cash funds", desc: isRtl ? "אפשרו לאורחים לתרום כסף למטרה מסוימת" : "Let guests contribute money toward a specific goal" },
                { href: `/dashboard/events/${event.id}/bundles`,      label: isRtl ? "מתנות חבילה" : "Bundle gifts", desc: isRtl ? "קבצו מוצרים יקרים כך שכמה אורחים יחלקו את העלות" : "Group expensive items so multiple guests can split the cost" },
                { href: `/dashboard/events/${event.id}/addresses`,    label: isRtl ? "כתובות משלוח" : "Delivery addresses", desc: isRtl ? "נהלו לאן לשלוח את המתנות שלכם" : "Manage where your gifts should be delivered" },
              ].map((item) => (
                <button key={item.href} onClick={() => router.push(item.href)}
                  className={`w-full flex items-center justify-between py-3 border-b border-warm-border/50 last:border-0 hover:opacity-70 transition-opacity text-left ${isRtl ? "flex-row-reverse text-right" : ""}`}>
                  <div className={isRtl ? "text-right" : ""}>
                    <p className="text-sm font-medium text-ink">{item.label}</p>
                    {item.desc && <p className="text-xs text-pebble mt-0.5">{item.desc}</p>}
                  </div>
                  <span className="text-mist text-xs flex-shrink-0">{isRtl ? "←" : "→"}</span>
                </button>
              ))}
              <div className={`pt-3 flex ${isRtl ? "justify-start" : "justify-end"}`}>
                <button onClick={handleDelete} className="text-xs text-red-300 hover:text-red-500 transition-colors">
                  {isRtl ? "מחק רשם" : "Delete registry"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: Gifts ── */}
          <div className="w-full lg:flex-1">
            <div className={`flex items-center justify-between mb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div>
                <h2 className="font-semibold text-ink text-lg">{isRtl ? "המתנות שלך" : "Your gifts"}</h2>
                {visibleProducts.length > 0 && (
                  <p className="text-pebble text-xs mt-0.5">
                    {isRtl ? `${visibleProducts.length} פריטים` : `${visibleProducts.length} item${visibleProducts.length !== 1 ? "s" : ""}`}
                  </p>
                )}
              </div>
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 bg-ink text-cream text-xs font-medium px-3.5 py-2 hover:opacity-80 transition-opacity rounded-lg">
                <span>+</span>
                <span>{isRtl ? "הוסף מתנה" : "Add gift"}</span>
              </button>
            </div>

            {visibleProducts.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="text-3xl mb-3">🎁</p>
                <p className="font-semibold text-ink mb-1 text-sm">{isRtl ? "עדיין אין מתנות" : "No gifts yet"}</p>
                <p className="text-pebble text-xs mb-5 max-w-xs mx-auto">
                  {isRtl ? "הוסף מתנות מחנויות ישראליות לרשם שלך" : "Add gifts from Israeli retailers to your registry"}
                </p>
                <button onClick={() => setShowModal(true)}
                  className="bg-ink text-cream text-xs font-medium px-5 py-2.5 hover:opacity-80 transition-opacity rounded-lg">
                  {isRtl ? "הוסף מתנה ראשונה" : "Add your first gift"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {previewProducts.map((product) => (
                    <ProductTile key={product.id} product={product} onRemove={() => handleRemoveProduct(product.id)} />
                  ))}
                </div>
                {visibleProducts.length > 9 && (
                  <button onClick={() => setShowAllGifts(true)}
                    className="w-full py-3 text-sm text-pebble hover:text-ink border border-warm-border rounded-xl transition-colors">
                    {isRtl ? `הצג את כל ${visibleProducts.length} המתנות` : `See all ${visibleProducts.length} gifts`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── See all modal ── */}
      {showAllGifts && (
        <div className="fixed inset-0 bg-ink/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAllGifts(false); }}>
          <div className="bg-cream rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className={`flex items-center justify-between px-6 py-4 border-b border-warm-border ${isRtl ? "flex-row-reverse" : ""}`}>
              <h3 className="font-semibold text-ink">
                {isRtl ? `כל המתנות (${visibleProducts.length})` : `All gifts (${visibleProducts.length})`}
              </h3>
              <button onClick={() => setShowAllGifts(false)} className="text-pebble hover:text-ink text-lg leading-none">✕</button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {visibleProducts.map((product) => (
                  <ProductTile key={product.id} product={product} onRemove={() => handleRemoveProduct(product.id)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add gift modal ── */}
      {showModal && (
        <AddGiftModal
          eventId={eventId}
          locale={locale}
          isRtl={isRtl}
          onClose={() => setShowModal(false)}
          onAdded={() => { refreshProducts(); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Product tile
═══════════════════════════════════════════════════════════════ */

function ProductTile({ product, onRemove }: { product: Product; onRemove?: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onRemove) return;
    setRemoving(true);
    onRemove();
  };

  return (
    <div className="relative group">
      <a href={product.url} target="_blank" rel="noopener noreferrer"
        className="card block overflow-hidden hover:-translate-y-0.5 transition-transform duration-200">
        <div className="w-full h-28 bg-warm-white overflow-hidden relative">
          {product.imageUrl && !imgFailed ? (
            <img src={product.imageUrl} alt={decodeHtml(product.title)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgFailed(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl opacity-20">🎁</span>
            </div>
          )}
        </div>
        <div className="p-2.5 h-16 flex flex-col justify-between">
          <p className="text-ink text-xs font-medium leading-snug line-clamp-2">{decodeHtml(product.title)}</p>
          {product.estimatedPrice && (
            <p className="text-pebble text-xs">₪{product.estimatedPrice.toLocaleString()}</p>
          )}
        </div>
      </a>

      {onRemove && (
        <button
          onClick={handleRemove}
          disabled={removing}
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 z-10"
          title="Remove gift"
        >
          {removing ? "…" : "✕"}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Add Gift Modal
═══════════════════════════════════════════════════════════════ */

function AddGiftModal({
  eventId, locale, isRtl, onClose, onAdded,
}: {
  eventId: string;
  locale: string;
  isRtl: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [tab, setTab] = useState<"link" | "browse">("link");
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [showRequestStore, setShowRequestStore] = useState(false);

  /* ── URL form state ── */
  const [url, setUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<FetchedMetadata | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "">("");

  const catLabels = isRtl ? CAT_LABELS_HE : CAT_LABELS_EN;
  const availableCats = RECOMMENDED_CATEGORY_ORDER.filter((c) =>
    RECOMMENDED_PRODUCTS.some((p) => p.category === c)
  );
  const filteredPicks = catFilter
    ? RECOMMENDED_PRODUCTS.filter((p) => p.category === catFilter)
    : RECOMMENDED_PRODUCTS;

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFetchError(null);
    if (!url.trim()) return;
    if (!isRetailerWhitelisted(url)) {
      setFetchError(
        isRtl
          ? `החנות לא מאושרת. חנויות מאושרות: ${getWhitelistedDomains().join(", ")}`
          : `Retailer not approved. Approved: ${getWhitelistedDomains().join(", ")}`
      );
      return;
    }
    setIsFetching(true);
    try {
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const result = await res.json();
      if (!result.success) { setFetchError(result.error || "Failed to fetch"); return; }
      setMetadata(result.data);
    } catch { setFetchError(isRtl ? "שגיאה" : "Failed to fetch preview"); }
    finally { setIsFetching(false); }
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metadata || !selectedCategory) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title: metadata.title, imageUrl: metadata.image, estimatedPrice: metadata.price, category: selectedCategory }),
      });
      if (res.ok) { onAdded(); setUrl(""); setMetadata(null); setSelectedCategory(""); }
      else { const d = await res.json(); setFetchError(d.error || "Failed to add"); }
    } catch { setFetchError(isRtl ? "שגיאה" : "Failed to add"); }
    finally { setIsSaving(false); }
  };

  const handleAddPick = async (pick: typeof RECOMMENDED_PRODUCTS[0]) => {
    setAddingId(pick.id);
    try {
      const res = await fetch(`/api/events/${eventId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: pick.url,
          title: isRtl ? pick.titleHe : pick.titleEn,
          imageUrl: pick.imageUrl,
          category: pick.category,
        }),
      });
      if (res.ok) { onAdded(); setAddedIds((prev) => new Set(prev).add(pick.id)); }
    } catch { /* silent */ }
    finally { setAddingId(null); }
  };

  return (
    <div className="fixed inset-0 bg-ink/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`bg-cream rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col ${isRtl ? "rtl" : "ltr"}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-warm-border shrink-0 ${isRtl ? "flex-row-reverse" : ""}`}>
          <h3 className="font-semibold text-ink text-base">{isRtl ? "הוסף מתנה" : "Add a gift"}</h3>
          <button onClick={onClose} className="text-pebble hover:text-ink text-lg leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b border-warm-border shrink-0 ${isRtl ? "flex-row-reverse" : ""}`}>
          {(["link", "browse"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t ? "text-ink border-b-2 border-ink" : "text-pebble hover:text-ink"
              }`}>
              {t === "link"
                ? (isRtl ? "הדבק קישור" : "Paste a link")
                : (isRtl ? "השראה" : "Browse inspiration")}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* ── Paste link tab ── */}
          {tab === "link" && (
            <div className="space-y-5">
              {!metadata ? (
                <form onSubmit={handleFetch} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      {isRtl ? "קישור למוצר" : "Product URL"}
                    </label>
                    <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} dir="ltr"
                      placeholder="https://foxhome.co.il/product/..."
                      className="w-full border border-warm-border bg-warm-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
                      disabled={isFetching} />
                  </div>
                  {fetchError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{fetchError}</p>}
                  <div>
                    <p className="text-xs text-pebble mb-2">{isRtl ? "חנויות מאושרות:" : "Approved retailers:"}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {getWhitelistedDomains().map((d) => (
                        <span key={d} className="px-2 py-1 bg-warm-white border border-warm-border rounded text-xs text-pebble">{d}</span>
                      ))}
                    </div>
                  </div>
                  <button type="submit" disabled={isFetching || !url.trim()}
                    className="w-full bg-ink text-cream text-sm font-medium py-2.5 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40">
                    {isFetching ? (isRtl ? "מאחזר..." : "Finding...") : (isRtl ? "אחזר תצוגה מקדימה" : "Find product")}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSaveLink} className="space-y-4">
                  {/* Preview card */}
                  <div className={`flex gap-3 p-3 bg-warm-white border border-warm-border rounded-xl ${isRtl ? "flex-row-reverse" : ""}`}>
                    {metadata.image && (
                      <img src={metadata.image} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink leading-snug line-clamp-2">{metadata.title}</p>
                      {metadata.price && <p className="text-pebble text-xs mt-1">₪{metadata.price.toLocaleString()}</p>}
                      {metadata.domain && <p className="text-mist text-xs mt-0.5">{metadata.domain}</p>}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      {isRtl ? "קטגוריה" : "Category"}
                    </label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | "")}
                      className="w-full border border-warm-border bg-warm-white rounded-lg px-3 py-2.5 text-sm focus:outline-none">
                      <option value="">{isRtl ? "בחר קטגוריה..." : "Select a category..."}</option>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{catLabels[cat] || cat}</option>
                      ))}
                    </select>
                  </div>

                  {fetchError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{fetchError}</p>}

                  <div className={`flex gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <button type="submit" disabled={isSaving || !selectedCategory}
                      className="flex-1 bg-ink text-cream text-sm font-medium py-2.5 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40">
                      {isSaving ? (isRtl ? "שומר..." : "Adding...") : (isRtl ? "הוסף לרשם" : "Add to registry")}
                    </button>
                    <button type="button" onClick={() => { setMetadata(null); setUrl(""); setFetchError(null); }}
                      className="px-4 py-2.5 border border-warm-border rounded-lg text-sm text-pebble hover:text-ink transition-colors">
                      {isRtl ? "ביטול" : "Back"}
                    </button>
                  </div>
                </form>
              )}

              {/* Request a store */}
              <div className="border-t border-warm-border pt-4">
                <button onClick={() => setShowRequestStore((v) => !v)}
                  className={`w-full flex items-center justify-between text-sm text-pebble hover:text-ink transition-colors ${isRtl ? "flex-row-reverse" : ""}`}>
                  <span>{isRtl ? "לא מוצאים את החנות שלכם?" : "Don't see your store?"}</span>
                  <span className="text-xs">{showRequestStore ? "▲" : "▼"}</span>
                </button>
                {showRequestStore && <RequestStoreForm isRtl={isRtl} />}
              </div>
            </div>
          )}

          {/* ── Browse picks tab ── */}
          {tab === "browse" && (
            <div className="space-y-4">
              {/* Category filter */}
              <div className={`flex flex-wrap gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                <button onClick={() => setCatFilter(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    catFilter === null ? "bg-ink text-cream" : "bg-warm-white border border-warm-border text-pebble hover:border-ink"
                  }`}>
                  {isRtl ? "הכל" : "All"}
                </button>
                {availableCats.map((cat) => (
                  <button key={cat} onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      catFilter === cat ? "bg-ink text-cream" : "bg-warm-white border border-warm-border text-pebble hover:border-ink"
                    }`}>
                    {catLabels[cat] || cat}
                  </button>
                ))}
              </div>

              {/* Picks grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredPicks.map((pick) => {
                  const added = addedIds.has(pick.id);
                  const loading = addingId === pick.id;
                  return (
                    <div key={pick.id} className="card overflow-hidden flex flex-col">
                      <a href={pick.url} target="_blank" rel="noopener noreferrer" className="block">
                        <div className="w-full h-24 bg-warm-white overflow-hidden relative">
                          {pick.imageUrl ? (
                            <img src={pick.imageUrl} alt={isRtl ? pick.titleHe : pick.titleEn}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-20 text-2xl">🎁</div>
                          )}
                        </div>
                      </a>
                      <div className="p-2.5 flex flex-col flex-1 gap-2">
                        <a href={pick.url} target="_blank" rel="noopener noreferrer"
                          className="text-ink text-xs font-medium leading-snug line-clamp-2 flex-1 hover:text-brand transition-colors">
                          {isRtl ? pick.titleHe : pick.titleEn}
                        </a>
                        <button onClick={() => handleAddPick(pick)} disabled={added || loading}
                          className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            added
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-ink text-cream hover:opacity-80 disabled:opacity-50"
                          }`}>
                          {loading ? "..." : added ? (isRtl ? "✓ נוסף" : "✓ Added") : (isRtl ? "+ הוסף" : "+ Add")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Request a store */}
              <div className="border-t border-warm-border pt-4">
                <button onClick={() => setShowRequestStore((v) => !v)}
                  className={`w-full flex items-center justify-between text-sm text-pebble hover:text-ink transition-colors ${isRtl ? "flex-row-reverse" : ""}`}>
                  <span>{isRtl ? "לא מוצאים את החנות שלכם?" : "Don't see your store?"}</span>
                  <span className="text-xs">{showRequestStore ? "▲" : "▼"}</span>
                </button>
                {showRequestStore && <RequestStoreForm isRtl={isRtl} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Request store form
═══════════════════════════════════════════════════════════════ */

function RequestStoreForm({ isRtl }: { isRtl: boolean }) {
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/whitelist-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, storeUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      if (data.mailtoLink) window.open(data.mailtoLink, "_blank");
      setDone(true);
    } catch { setError(isRtl ? "שגיאה" : "Failed to submit"); }
    finally { setIsLoading(false); }
  };

  if (done) return (
    <p className="mt-3 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
      {isRtl ? "✓ הבקשה נשלחה!" : "✓ Request sent — we'll be in touch!"}
    </p>
  );

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required
        placeholder={isRtl ? "שם החנות" : "Store name"}
        className="w-full border border-warm-border bg-warm-white rounded-lg px-3 py-2 text-sm focus:outline-none" />
      <input type="url" value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} required dir="ltr"
        placeholder="https://www.example.co.il"
        className="w-full border border-warm-border bg-warm-white rounded-lg px-3 py-2 text-sm focus:outline-none" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={isLoading}
        className="w-full bg-ink text-cream text-xs font-medium py-2 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40">
        {isLoading ? (isRtl ? "שולח..." : "Sending...") : (isRtl ? "שלח בקשה" : "Send request")}
      </button>
    </form>
  );
}
