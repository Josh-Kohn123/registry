"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  RECOMMENDED_PRODUCTS,
  RECOMMENDED_CATEGORY_ORDER,
  RecommendedProduct,
} from "@/data/recommended-products";

const CATEGORY_LABELS_EN: Record<string, string> = {
  kitchen: "Kitchen",
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  "living-room": "Living Room",
  decor: "Decor",
  electronics: "Electronics",
  outdoor: "Outdoor",
  other: "Other",
};

const CATEGORY_LABELS_HE: Record<string, string> = {
  kitchen: "מטבח",
  bedroom: "חדר שינה",
  bathroom: "חדר אמבטיה",
  "living-room": "סלון",
  decor: "עיצוב",
  electronics: "אלקטרוניקה",
  outdoor: "חוץ",
  other: "אחר",
};

const CATEGORY_ICONS: Record<string, string> = {
  bedroom: "🛏️",
  kitchen: "🍳",
  bathroom: "🛁",
  "living-room": "🛋️",
  decor: "🕯️",
  electronics: "💡",
  outdoor: "🌿",
  other: "🎁",
};

const RETAILER_COLORS: Record<string, string> = {
  "foxhome.co.il": "bg-orange-100 text-orange-800",
  "ikea.com": "bg-yellow-100 text-yellow-800",
  "ace.co.il": "bg-red-100 text-red-800",
};

const CATEGORY_PLACEHOLDER_BG: Record<string, string> = {
  bedroom: "bg-indigo-50",
  kitchen: "bg-amber-50",
  bathroom: "bg-cyan-50",
  "living-room": "bg-emerald-50",
  decor: "bg-pink-50",
  electronics: "bg-blue-50",
  outdoor: "bg-green-50",
  other: "bg-gray-50",
};

export default function InspirationPage() {
  const locale = useLocale();
  const isRtl = locale === "he";

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<
    Record<string, string | null | undefined>
  >({});

  const categoryLabels = isRtl ? CATEGORY_LABELS_HE : CATEGORY_LABELS_EN;

  // Fetch product images in batches
  useEffect(() => {
    const BATCH_SIZE = 5;
    const products = [...RECOMMENDED_PRODUCTS];

    const fetchAll = async () => {
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (product) => {
            try {
              const res = await fetch("/api/metadata", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: product.url }),
              });
              const result = await res.json();
              const imageUrl =
                result.success && result.data?.image
                  ? (result.data.image as string)
                  : null;
              setProductImages((prev) => ({ ...prev, [product.id]: imageUrl }));
            } catch {
              setProductImages((prev) => ({ ...prev, [product.id]: null }));
            }
          })
        );
      }
    };

    fetchAll();
  }, []);

  const availableCategories = RECOMMENDED_CATEGORY_ORDER.filter((cat) =>
    RECOMMENDED_PRODUCTS.some((p) => p.category === cat)
  );

  const visibleProducts = selectedCategory
    ? RECOMMENDED_PRODUCTS.filter((p) => p.category === selectedCategory)
    : RECOMMENDED_PRODUCTS;

  const groupedCategories = RECOMMENDED_CATEGORY_ORDER.filter((cat) =>
    visibleProducts.some((p) => p.category === cat)
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${isRtl ? "rtl" : "ltr"}`}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-200 mb-4">
            {isRtl ? "השראה לרשם המתנות שלכם" : "Gift Registry Inspiration"}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            {isRtl
              ? "המתנות שזוגות אוהבים לקבל"
              : "Gifts couples actually love to receive"}
          </h1>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            {isRtl
              ? "בחרנו עבורכם את המוצרים הכי פופולריים מ-IKEA, FOX HOME, ACE ועוד. הוסיפו אותם לרשם שלכם בלחיצה אחת."
              : "We hand-picked the most popular items from IKEA, FOX HOME, ACE and more. Create your registry and add them with a single click."}
          </p>
          <Link href="/login">
            <button className="bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl text-lg shadow-lg hover:bg-indigo-50 transition-colors">
              {isRtl ? "✨ צרו את הרשם שלכם בחינם" : "✨ Create your free registry"}
            </button>
          </Link>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <span className="text-green-500 font-bold">✓</span>
            {isRtl ? "חינמי לחלוטין" : "Completely free"}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-green-500 font-bold">✓</span>
            {isRtl ? "חנויות ישראליות מאושרות" : "Approved Israeli retailers"}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-green-500 font-bold">✓</span>
            {isRtl ? "הגנה מפני כפילויות" : "Duplicate-gift protection"}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-green-500 font-bold">✓</span>
            {isRtl ? "שיתוף קל בוואטסאפ" : "Easy WhatsApp sharing"}
          </span>
        </div>
      </div>

      {/* ── Product grid ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-14">

        {/* Category filter tabs */}
        <div className={`flex flex-wrap gap-2 mb-10 ${isRtl ? "flex-row-reverse" : ""}`}>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:border-gray-500"
            }`}
          >
            {isRtl ? "הכל" : "All"}
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:border-gray-500"
              }`}
            >
              <span>{CATEGORY_ICONS[cat] || "🎁"}</span>
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>

        {/* Sections by category */}
        <div className="space-y-14">
          {groupedCategories.map((cat) => {
            const productsInCat = visibleProducts.filter(
              (p) => p.category === cat
            );
            return (
              <section key={cat}>
                <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[cat] || "🎁"}</span>
                  {categoryLabels[cat] || cat}
                  <span className="ml-auto text-sm font-normal text-gray-400">
                    {productsInCat.length} {isRtl ? "מוצרים" : "items"}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productsInCat.map((product) => (
                    <InspirationCard
                      key={product.id}
                      product={product}
                      imageUrl={productImages[product.id]}
                      isRtl={isRtl}
                      categoryLabels={categoryLabels}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            {isRtl ? "מוכנים לבנות את הרשם שלכם?" : "Ready to build your registry?"}
          </h2>
          <p className="text-indigo-100 text-lg mb-8">
            {isRtl
              ? "צרו רשם מתנות תוך דקות, הוסיפו את המוצרים שאהבתם, ושתפו עם האורחים."
              : "Create a registry in minutes, add the items you loved, and share it with your guests."}
          </p>
          <Link href="/login">
            <button className="bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl text-lg shadow-lg hover:bg-indigo-50 transition-colors">
              {isRtl ? "התחילו עכשיו — בחינם" : "Get started — it's free"}
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

// ── InspirationCard component ─────────────────────────────────────────────────

interface InspirationCardProps {
  product: RecommendedProduct;
  imageUrl: string | null | undefined;
  isRtl: boolean;
  categoryLabels: Record<string, string>;
}

function InspirationCard({
  product,
  imageUrl,
  isRtl,
  categoryLabels,
}: InspirationCardProps) {
  const imageLoaded = imageUrl !== undefined;
  const placeholderBg = CATEGORY_PLACEHOLDER_BG[product.category] || "bg-gray-50";
  const retailerColor =
    RETAILER_COLORS[product.retailerDomain] || "bg-gray-100 text-gray-700";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
      {/* Image */}
      <div className={`w-full h-44 overflow-hidden relative ${placeholderBg}`}>
        {!imageLoaded ? (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={isRtl ? product.titleHe : product.titleEn}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-40">
            <span className="text-4xl font-bold text-gray-400">
              {(categoryLabels[product.category] || product.category)
                .charAt(0)
                .toUpperCase()}
            </span>
            <span className="text-xs text-gray-400 uppercase tracking-widest">
              {product.retailerName}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1">
            {isRtl ? product.titleHe : product.titleEn}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2">
            {isRtl ? product.descriptionHe : product.descriptionEn}
          </p>
        </div>

        {/* Retailer badge + view link */}
        <div className="flex items-center justify-between mt-auto">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${retailerColor}`}>
            {product.retailerName}
          </span>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            {isRtl ? "עיין בחנות ↗" : "View product ↗"}
          </a>
        </div>

        {/* CTA */}
        <Link href="/login" className="block">
          <button className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all">
            {isRtl ? "✨ הוסף לרשם שלי" : "✨ Add to my registry"}
          </button>
        </Link>
      </div>
    </div>
  );
}
