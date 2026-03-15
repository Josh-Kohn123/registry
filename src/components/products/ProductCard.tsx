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
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    // Non-blocking fire-and-forget tracking (F10)
    if (eventId) {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId: product.id, eventType: "product_click" }),
        keepalive: true,
      }).catch(() => {});
    }
    // Navigate immediately
    window.open(product.url, "_blank", "noopener,noreferrer");
  };

  const labels = {
    en: {
      buyOn: `Buy on ${getRetailerName(product.retailerDomain)}`,
      disclaimer: "You will be leaving this site",
      openInNewTab: "Opens in new tab",
    },
    he: {
      buyOn: `קנה ב-${getRetailerName(product.retailerDomain)}`,
      disclaimer: "לחיצה תעביר אותך לאתר חיצוני",
      openInNewTab: "נפתח בלשונית חדשה",
    },
  };

  const text = labels[locale as keyof typeof labels] || labels.en;
  const retailerName = getRetailerName(product.retailerDomain);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col bg-white">
      {/* Product Image */}
      {product.imageUrl && (
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Product Info */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
          {product.title}
        </h3>

        {/* Retailer domain + price */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">{retailerName}</span>
          {(product.estimatedPrice || product.previousPrice) && (
            <span className="text-sm font-bold text-green-700" dir="ltr">
              ₪{(product.estimatedPrice || product.previousPrice)?.toLocaleString("he-IL")}
            </span>
          )}
        </div>

        {/* CTA and disclaimer */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <button
            className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition flex items-center justify-center gap-1"
            onClick={handleClick}
            aria-label={`${text.buyOn} - ${text.openInNewTab}`}
          >
            {text.buyOn} <span className="text-xs">↗</span>
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            ⚠ {text.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
