"use client";

import Image from "next/image";
import { ProductLink } from "@/types/product";
import { getRetailerName } from "@/lib/retailer-whitelist";

interface ProductCardProps {
  product: ProductLink;
  locale?: string;
  eventId?: string;
}

/** Decode HTML entities that may have been stored in product titles (e.g. &#39; → ', &#x05DB; → כ) */
function decodeTitle(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) =>
      String.fromCodePoint(parseInt(dec, 10))
    )
    .trim();
}

export function ProductCard({ product, locale = "en", eventId }: ProductCardProps) {
  const retailerName = getRetailerName(product.retailerDomain);
  const displayTitle = decodeTitle(product.title);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col bg-white">
      {/* Product Image */}
      {product.imageUrl && (
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={displayTitle}
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
          {displayTitle}
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

        {/* Disclaimer */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            {locale === "he" ? "לחיצה תעביר אותך לאתר חיצוני" : "You will be leaving this site"}
          </p>
        </div>
      </div>
    </div>
  );
}
