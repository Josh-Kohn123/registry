"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { ProductLink, PRODUCT_CATEGORIES, ProductCategory } from "@/types/product";
import { Bundle } from "@/types/bundle";

interface ProductFilterProps {
  products: ProductLink[];
  bundles: Bundle[];
  onFilteredProducts: (products: ProductLink[]) => void;
  onFilteredBundles: (bundles: Bundle[]) => void;
}

const CATEGORY_LABELS: Record<string, Record<ProductCategory, string>> = {
  en: {
    kitchen: "Kitchen",
    bedroom: "Bedroom",
    bathroom: "Bathroom",
    "living-room": "Living Room",
    decor: "Decor",
    electronics: "Electronics",
    outdoor: "Outdoor",
    other: "Other",
  },
  he: {
    kitchen: "מטבח",
    bedroom: "חדר שינה",
    bathroom: "חדר אמבטיה",
    "living-room": "סלון",
    decor: "עיצוב",
    electronics: "אלקטרוניקה",
    outdoor: "חוץ",
    other: "אחר",
  },
};

export function ProductFilter({
  products,
  bundles,
  onFilteredProducts,
  onFilteredBundles,
}: ProductFilterProps) {
  const locale = useLocale();
  const isRtl = locale === "he";

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedRetailers, setSelectedRetailers] = useState<Set<string>>(new Set());

  // Derive available options from data
  const { retailers, categories } = useMemo(() => {
    const retailerSet = new Set(products.map((p) => p.retailerDomain));
    const categorySet = new Set(
      products.map((p) => p.category).filter(Boolean) as string[]
    );

    return {
      retailers: Array.from(retailerSet).sort(),
      categories: Array.from(categorySet).sort(),
    };
  }, [products, bundles]);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const applyFilters = (
    newCategories?: Set<string>,
    newRetailers?: Set<string>
  ) => {
    const cats = newCategories || selectedCategories;
    const rets = newRetailers || selectedRetailers;

    const filteredProducts = products.filter((p) => {
      // Category filter
      if (cats.size > 0 && p.category && !cats.has(p.category)) return false;
      if (cats.size > 0 && !p.category) return false; // exclude uncategorized when filtering by category

      // Retailer filter
      if (rets.size > 0 && !rets.has(p.retailerDomain)) return false;

      return true;
    });

    const filteredBundles = bundles.filter((b) => {
      // Retailer filter for bundles
      if (rets.size > 0 && !rets.has(b.storeDomain)) return false;
      return true;
    });

    onFilteredProducts(filteredProducts);
    onFilteredBundles(filteredBundles);
  };

  const toggleCategory = (cat: string) => {
    const next = new Set(selectedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setSelectedCategories(next);
    applyFilters(next);
  };

  const toggleRetailer = (ret: string) => {
    const next = new Set(selectedRetailers);
    if (next.has(ret)) next.delete(ret);
    else next.add(ret);
    setSelectedRetailers(next);
    applyFilters(undefined, next);
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());
    setSelectedRetailers(new Set());
    onFilteredProducts(products);
    onFilteredBundles(bundles);
  };

  const hasActiveFilters =
    selectedCategories.size > 0 ||
    selectedRetailers.size > 0;

  const labels = isRtl
    ? {
        filter: "סינון לפי קטגוריה",
        category: "קטגוריה",
        retailer: "חנות",
        clear: "נקה סינון",
      }
    : {
        filter: "Filter by Category",
        category: "Category",
        retailer: "Store",
        clear: "Clear Filters",
      };

  const categoryLabels = CATEGORY_LABELS[locale] || CATEGORY_LABELS.en;

  // Don't render the filter at all if there's nothing to filter by
  if (categories.length === 0 && retailers.length <= 1) return null;

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={handleExpand}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          hasActiveFilters
            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        {labels.filter}
        {hasActiveFilters && (
          <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {selectedCategories.size + selectedRetailers.size}
          </span>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {labels.category}
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedCategories.has(cat)
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:border-blue-400"
                    }`}
                  >
                    {categoryLabels[cat as ProductCategory] || cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Retailers */}
          {retailers.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {labels.retailer}
              </label>
              <div className="flex flex-wrap gap-2">
                {retailers.map((ret) => (
                  <button
                    key={ret}
                    type="button"
                    onClick={() => toggleRetailer(ret)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedRetailers.has(ret)
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:border-blue-400"
                    }`}
                  >
                    {ret}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              {labels.clear}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
