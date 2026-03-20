"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  RECOMMENDED_PRODUCTS,
  RECOMMENDED_CATEGORY_ORDER,
  RecommendedProduct,
} from "@/data/recommended-products";

/* ── Label maps ──────────────────────────────────────────────────────── */

const LABELS_EN: Record<string, string> = {
  kitchen: "Kitchen",
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  "living-room": "Living Room",
  decor: "Decor",
  electronics: "Electronics",
  outdoor: "Outdoor",
  other: "Other",
};

const LABELS_HE: Record<string, string> = {
  kitchen: "מטבח",
  bedroom: "חדר שינה",
  bathroom: "חדר אמבטיה",
  "living-room": "סלון",
  decor: "עיצוב",
  electronics: "אלקטרוניקה",
  outdoor: "חוץ",
  other: "אחר",
};

const CAT_ICONS: Record<string, string> = {
  bedroom: "🛏",
  kitchen: "🍳",
  bathroom: "🛁",
  "living-room": "🛋",
  decor: "🕯",
  electronics: "💡",
  outdoor: "🌿",
  other: "🎁",
};

const RETAILER_PILL: Record<string, string> = {
  "foxhome.co.il": "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  "ikea.com":      "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
  "ace.co.il":     "bg-red-50   text-red-700   ring-1 ring-red-200",
};

const CAT_PLACEHOLDER: Record<string, string> = {
  bedroom:     "bg-indigo-50",
  kitchen:     "bg-amber-50",
  bathroom:    "bg-cyan-50",
  "living-room":"bg-emerald-50",
  decor:       "bg-pink-50",
  electronics: "bg-blue-50",
  outdoor:     "bg-green-50",
  other:       "bg-gray-50",
};

/* ── Page ────────────────────────────────────────────────────────────── */

export default function InspirationPage() {
  const locale = useLocale();
  const isRtl = locale === "he";
  const labels = isRtl ? LABELS_HE : LABELS_EN;

  const [selected, setSelected] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, string | null | undefined>>({});

  // Batch-fetch product images
  useEffect(() => {
    const BATCH = 5;
    const products = [...RECOMMENDED_PRODUCTS];
    const run = async () => {
      for (let i = 0; i < products.length; i += BATCH) {
        await Promise.all(
          products.slice(i, i + BATCH).map(async (p) => {
            try {
              const r = await fetch("/api/metadata", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: p.url }),
              });
              const d = await r.json();
              setImages((prev) => ({
                ...prev,
                [p.id]: d.success && d.data?.image ? d.data.image : null,
              }));
            } catch {
              setImages((prev) => ({ ...prev, [p.id]: null }));
            }
          })
        );
      }
    };
    run();
  }, []);

  const availableCats = RECOMMENDED_CATEGORY_ORDER.filter((c) =>
    RECOMMENDED_PRODUCTS.some((p) => p.category === c)
  );
  const visible = selected
    ? RECOMMENDED_PRODUCTS.filter((p) => p.category === selected)
    : RECOMMENDED_PRODUCTS;
  const grouped = RECOMMENDED_CATEGORY_ORDER.filter((c) =>
    visible.some((p) => p.category === c)
  );

  return (
    <div className={`min-h-screen bg-cream ${isRtl ? "rtl" : "ltr"}`}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-cream border-b border-warm-border pt-16 pb-14 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="eyebrow mb-5">
            {isRtl ? "השראה לרשם המתנות שלכם" : "Gift Registry Inspiration"}
          </p>
          <h1
            className="font-display font-normal text-ink leading-[1.05] tracking-tight mb-5"
            style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.75rem)" }}
          >
            {isRtl ? (
              <>המתנות שזוגות<br /><em className="text-brand">באמת אוהבים לקבל</em></>
            ) : (
              <>Gifts couples<br /><em className="text-brand">actually love to receive</em></>
            )}
          </h1>
          <div className="w-8 h-px bg-warm-border mx-auto mb-5" />
          <p className="text-pebble font-light text-base leading-relaxed max-w-lg mx-auto mb-8">
            {isRtl
              ? "בחרנו עבורכם את המוצרים הכי פופולריים מ-IKEA, FOX HOME, ACE ועוד. הוסיפו לרשם שלכם בלחיצה אחת."
              : "Hand-picked favourites from IKEA, FOX HOME, ACE and more. Create your registry and add any of them in one click."}
          </p>
          <Link href="/login">
            <button className="bg-ink text-cream text-[11px] font-medium tracking-[0.08em] uppercase px-8 py-3.5 hover:opacity-80 transition-opacity">
              {isRtl ? "יצירת רשם חינמי" : "Create your registry — free"}
            </button>
          </Link>
        </div>
      </section>

      {/* ── Trust strip ───────────────────────────────────────────────── */}
      <div className="bg-warm-white border-b border-warm-border py-4 px-5">
        <div
          className={`max-w-4xl mx-auto flex flex-wrap justify-center gap-7 text-sm text-pebble ${
            isRtl ? "flex-row-reverse" : ""
          }`}
        >
          {(isRtl
            ? ["חינמי לחלוטין", "חנויות ישראליות מאושרות", "הגנה מפני כפילויות", "שיתוף קל בוואטסאפ"]
            : ["Completely free", "Approved Israeli retailers", "No duplicate gifts", "Easy WhatsApp sharing"]
          ).map((label) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="text-brand text-xs">✦</span>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Products ──────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-16">

        {/* Category pill filters */}
        <div
          className={`flex flex-wrap gap-2 mb-12 ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <FilterPill
            active={selected === null}
            onClick={() => setSelected(null)}
          >
            {isRtl ? "הכל" : "All"}
          </FilterPill>
          {availableCats.map((cat) => (
            <FilterPill
              key={cat}
              active={selected === cat}
              onClick={() => setSelected(selected === cat ? null : cat)}
            >
              <span className="mr-1">{CAT_ICONS[cat]}</span>
              {labels[cat] || cat}
            </FilterPill>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-16">
          {grouped.map((cat) => {
            const items = visible.filter((p) => p.category === cat);
            return (
              <section key={cat}>
                <div
                  className={`flex items-center gap-3 mb-6 pb-4 border-b border-warm-border ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  <span className="text-xl">{CAT_ICONS[cat]}</span>
                  <h2 className="font-semibold text-ink text-lg">
                    {labels[cat] || cat}
                  </h2>
                  <span className="text-xs text-mist font-medium px-2 py-0.5 bg-cream rounded-full border border-warm-border ml-auto">
                    {items.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      imageUrl={images[product.id]}
                      isRtl={isRtl}
                      labels={labels}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────── */}
      <section className="bg-cream border-t border-warm-border py-20 px-5">
        <div className="max-w-xl mx-auto text-center">
          <p className="eyebrow mb-4">
            {isRtl ? "הצטרפו אלינו" : "Ready to build yours?"}
          </p>
          <h2 className="font-display font-normal text-ink mb-3 leading-tight"
              style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)" }}>
            {isRtl
              ? <><em className="text-brand">בנו</em> את הרשם שלכם</>
              : <>Your registry,<br /><em className="text-brand">ready in minutes.</em></>}
          </h2>
          <div className="w-8 h-px bg-warm-border mx-auto my-5" />
          <p className="text-pebble font-light text-base leading-relaxed mb-8">
            {isRtl
              ? "צרו רשם תוך דקות, הוסיפו את המוצרים שאהבתם, ושתפו עם האורחים."
              : "Create a registry in minutes, add what you loved, and share one link with your guests."}
          </p>
          <Link href="/login">
            <button className="bg-ink text-cream text-[11px] font-medium tracking-[0.08em] uppercase px-8 py-3.5 hover:opacity-80 transition-opacity">
              {isRtl ? "יצירת רשם חינמי" : "Create your registry — free"}
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────── */

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-ink text-warm-white shadow-sm"
          : "bg-warm-white border border-warm-border text-pebble hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function ProductCard({
  product,
  imageUrl,
  isRtl,
  labels,
}: {
  product: RecommendedProduct;
  imageUrl: string | null | undefined;
  isRtl: boolean;
  labels: Record<string, string>;
}) {
  const imageLoaded = imageUrl !== undefined;
  const placeholder = CAT_PLACEHOLDER[product.category] || "bg-gray-50";
  const pill =
    RETAILER_PILL[product.retailerDomain] || "bg-gray-50 text-gray-600 ring-1 ring-gray-200";

  return (
    <div className="card flex flex-col overflow-hidden group hover:-translate-y-0.5 transition-transform duration-200">
      {/* Image */}
      <div className={`w-full h-44 relative overflow-hidden ${placeholder}`}>
        {!imageLoaded ? (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-warm-border via-cream to-warm-border" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={isRtl ? product.titleHe : product.titleEn}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-25 gap-1">
            <span className="text-5xl">{CAT_ICONS[product.category] || "🎁"}</span>
            <span className="text-xs tracking-widest uppercase font-medium text-ink">
              {product.retailerName}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className={isRtl ? "text-right" : ""}>
          <h3 className="font-semibold text-ink text-sm leading-snug mb-1">
            {isRtl ? product.titleHe : product.titleEn}
          </h3>
          <p className="text-xs text-pebble line-clamp-2 leading-relaxed">
            {isRtl ? product.descriptionHe : product.descriptionEn}
          </p>
        </div>

        <div
          className={`flex items-center justify-between mt-auto ${
            isRtl ? "flex-row-reverse" : ""
          }`}
        >
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pill}`}>
            {product.retailerName}
          </span>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-pebble hover:text-brand transition-colors"
          >
            {isRtl ? "צפו במוצר ↗" : "View ↗"}
          </a>
        </div>

        <Link href="/login" className="block">
          <button className="w-full py-2.5 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dark transition-colors">
            {isRtl ? "הוסיפו לרשם שלי →" : "Add to my registry →"}
          </button>
        </Link>
      </div>
    </div>
  );
}
