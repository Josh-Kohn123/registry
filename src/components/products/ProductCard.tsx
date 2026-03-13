"use client";

import Image from "next/image";
import { ProductLink } from "@/types/product";
import { getRetailerName } from "@/lib/retailer-whitelist";
import { trackOutboundClick } from "@/lib/tracking";

interface ProductCardProps {
  product: ProductLink;
  locale?: string;
  eventId?: string;
}

export function ProductCard({ product, locale = "en", eventId }: ProductCardProps) {
  const handleClick = async () => {
    if (eventId) {
      await trackOutboundClick(eventId, "product", product.id, product.url);
    }
    window.open(product.url, "_blank");
  };
  const labels = {
    en: {
      viewAtStore: "View at Store →",
      estimated: "Estimated price",
      openInNewWindow: "Opens in a new window",
    },
    he: {
      viewAtStore: "צפה בחנות ←",
      estimated: "מחיר משוער",
      openInNewWindow: "נפתח בחלון חדש",
    },
  };

  const text = labels[locale as keyof typeof labels] || labels.en;
  const retailerName = getRetailerName(product.retailerDomain);

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full"
      title={text.openInNewWindow}
    >
      <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col bg-white">
        {/* Product Image */}
        {product.imageUrl && (
          <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Product Info */}
        <div className="flex flex-col flex-1 p-4">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
            {product.title}
          </h3>

          {/* Price (if available) */}
          {product.estimatedPrice && (
            <div className="mb-3">
              <p className="text-xs text-gray-600">{text.estimated}</p>
              <p className="text-lg font-bold text-gray-900">
                ₪{product.estimatedPrice.toLocaleString("he-IL")}
              </p>
            </div>
          )}

          {/* Retailer info and CTA */}
          <div className="mt-auto pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-600 mb-2">
              {retailerName}
            </div>
            <button
              className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition flex items-center justify-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                handleClick();
              }}
            >
              {text.viewAtStore}
              <span className="text-xs">↗</span>
            </button>
          </div>
        </div>
      </div>
    </a>
  );
}
