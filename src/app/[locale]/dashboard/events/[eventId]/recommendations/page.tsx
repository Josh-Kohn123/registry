"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  RECOMMENDED_PRODUCTS,
  RECOMMENDED_CATEGORY_ORDER,
  RecommendedProduct,
} from "@/data/recommended-products";

interface RecommendationsPageProps {
  params: Promise<{ eventId: string }>;
}

type AddState = "idle" | "adding" | "added" | "error";

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

const RETAILER_COLORS: Record<string, string> = {
  "foxhome.co.il": "bg-orange-100 text-orange-800",
  "ikea.com": "bg-yellow-100 text-yellow-800",
  "ace.co.il": "bg-red-100 text-red-800",
  "naamanp.co.il": "bg-purple-100 text-purple-800",
  "terminalx.com": "bg-gray-100 text-gray-800",
  "castro.com": "bg-pink-100 text-pink-800",
};

// Pastel background colours for image placeholders, by category
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

export default function RecommendationsPage({
  params,
}: RecommendationsPageProps) {
  const { eventId } = use(params);
  const locale = useLocale();
  const isRtl = locale === "he";
  const router = useRouter();

  const [addStates, setAddStates] = useState<Record<string, AddState>>({});
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);

  // productImages: undefined = not fetched yet, null = fetched but no image, string = image URL
  const [productImages, setProductImages] = useState<
    Record<string, string | null | undefined>
  >({});

  const categoryLabels = isRtl ? CATEGORY_LABELS_HE : CATEGORY_LABELS_EN;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setIsAuthed(true);
      }
    });
  }, [router]);

  // Fetch metadata images in parallel batches once authed
  const fetchImages = useCallback(async () => {
    const BATCH_SIZE = 5;
    const products = [...RECOMMENDED_PRODUCTS];

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
  }, []);

  useEffect(() => {
    if (isAuthed) {
      fetchImages();
    }
  }, [isAuthed, fetchImages]);

  const handleAdd = async (product: RecommendedProduct) => {
    setAddStates((s) => ({ ...s, [product.id]: "adding" }));

    try {
      const title = isRtl ? product.titleHe : product.titleEn;
      const imageUrl = productImages[product.id] ?? undefined;

      const addRes = await fetch(`/api/events/${eventId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: product.url,
          title,
          imageUrl,
          category: product.category,
        }),
      });

      if (addRes.ok) {
        setAddStates((s) => ({ ...s, [product.id]: "added" }));
        setAddedIds((s) => new Set(s).add(product.id));
      } else {
        const err = await addRes.json();
        console.error("Add failed:", err);
        setAddStates((s) => ({ ...s, [product.id]: "error" }));
        setTimeout(
          () => setAddStates((s) => ({ ...s, [product.id]: "idle" })),
          3000
        );
      }
    } catch (e) {
      console.error("Add error:", e);
      setAddStates((s) => ({ ...s, [product.id]: "error" }));
      setTimeout(
        () => setAddStates((s) => ({ ...s, [product.id]: "idle" })),
        3000
      );
    }
  };

  const availableCategories = RECOMMENDED_CATEGORY_ORDER.filter((cat) =>
    RECOMMENDED_PRODUCTS.some((p) => p.category === cat)
  );

  const visibleProducts = selectedCategory
    ? RECOMMENDED_PRODUCTS.filter((p) => p.category === selectedCategory)
    : RECOMMENDED_PRODUCTS;

  const groupedCategories = RECOMMENDED_CATEGORY_ORDER.filter((cat) =>
    visibleProducts.some((p) => p.category === cat)
  );

  if (!isAuthed) return null;

  return (
    <div className={`min-h-screen bg-gray-50 py-10 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/events/${eventId}/products`)}
            className="text-sm text-blue-600 hover:underline mb-4 block"
          >
            ← {isRtl ? "חזור לניהול מוצרים" : "Back to Products"}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isRtl ? "מוצרים מומלצים" : "Recommended Products"}
          </h1>
          <p className="text-gray-500 mt-2">
            {isRtl
              ? "מוצרים פופולריים מחנויות מאושרות — לחצו הוסף לרשימה להוספה מיידית לרשימת המתנות שלכם"
              : "Popular items from approved Israeli retailers — click Add to Registry to instantly add them to your gift list"}
          </p>
        </div>

        {/* Category filter tabs */}
        <div className={`flex flex-wrap gap-2 mb-8 ${isRtl ? "flex-row-reverse" : ""}`}>
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
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:border-gray-500"
              }`}
            >
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>

        {/* Sections by category */}
        <div className="space-y-12">
          {groupedCategories.map((cat) => {
            const productsInCat = visibleProducts.filter(
              (p) => p.category === cat
            );
            return (
              <section key={cat}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  {categoryLabels[cat] || cat}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productsInCat.map((product) => {
                    const state = addStates[product.id] || "idle";
                    const alreadyAdded = addedIds.has(product.id);
                    const retailerColor =
                      RETAILER_COLORS[product.retailerDomain] ||
                      "bg-gray-100 text-gray-700";
                    const imageUrl = productImages[product.id];
                    const imageLoaded = imageUrl !== undefined;
                    const placeholderBg =
                      CATEGORY_PLACEHOLDER_BG[product.category] || "bg-gray-50";

                    return (
                      <div
                        key={product.id}
                        className={`bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col transition-shadow hover:shadow-md ${
                          alreadyAdded ? "ring-2 ring-green-400" : ""
                        }`}
                      >
                        {/* Product image / skeleton */}
                        <div className={`w-full h-44 overflow-hidden relative ${placeholderBg}`}>
                          {!imageLoaded ? (
                            // Skeleton shimmer
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
                          ) : imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={isRtl ? product.titleHe : product.titleEn}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Hide broken image, show placeholder bg
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            // No image — show category initial placeholder
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
                          {alreadyAdded && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              ✓ {isRtl ? "נוסף" : "Added"}
                            </div>
                          )}
                        </div>

                        {/* Card body */}
                        <div className="p-4 flex flex-col gap-3 flex-1">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1">
                              {isRtl ? product.titleHe : product.titleEn}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {isRtl ? product.descriptionHe : product.descriptionEn}
                            </p>
                          </div>

                          {/* Store badge + browse link */}
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${retailerColor}`}>
                              {product.retailerName}
                            </span>
                            <a
                              href={product.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {isRtl ? "עיין בחנות ↗" : "Browse ↗"}
                            </a>
                          </div>

                          {/* Add button */}
                          <button
                            onClick={() => !alreadyAdded && handleAdd(product)}
                            disabled={state === "adding" || alreadyAdded}
                            className={`mt-auto w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors ${
                              alreadyAdded
                                ? "bg-green-100 text-green-700 cursor-default"
                                : state === "adding"
                                ? "bg-gray-200 text-gray-500 cursor-wait"
                                : state === "error"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-900 text-white hover:bg-gray-700"
                            }`}
                          >
                            {alreadyAdded
                              ? isRtl ? "✓ נוסף לרשימה" : "✓ Added to Registry"
                              : state === "adding"
                              ? isRtl ? "מוסיף..." : "Adding..."
                              : state === "error"
                              ? isRtl ? "שגיאה — נסה שוב" : "Error — try again"
                              : isRtl ? "הוסף לרשימה" : "Add to Registry"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Bottom nav */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <button
            onClick={() => router.push(`/dashboard/events/${eventId}/products`)}
            className="text-sm text-blue-600 hover:underline"
          >
            {isRtl ? "← חזרה לניהול מוצרים" : "← Back to manage your products"}
          </button>
        </div>
      </div>
    </div>
  );
}
