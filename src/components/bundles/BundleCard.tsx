"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bundle } from "@/types/bundle";

interface BundleCardProps {
  bundle: Bundle;
  eventId?: string;
}

const DEFAULT_BUNDLE_IMAGE = "/globe.svg";

export function BundleCard({ bundle, eventId }: BundleCardProps) {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);

  // Calculate total price from items
  const totalPrice = bundle.items.reduce(
    (sum, item) => sum + (item.estimatedPrice || item.previousPrice || 0),
    0
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Image */}
      <div className="w-full h-48 bg-gray-200 overflow-hidden">
        <img
          src={bundle.imageUrl || DEFAULT_BUNDLE_IMAGE}
          alt={bundle.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_BUNDLE_IMAGE;
          }}
        />
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Title and Description */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold">{bundle.title}</h3>
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded whitespace-nowrap ms-2">
            {t("gifts.bundleItems") || "Bundle"}
          </span>
        </div>
        {bundle.description && (
          <p className="text-gray-600 text-sm mb-3">{bundle.description}</p>
        )}

        {/* Price */}
        {totalPrice > 0 && (
          <div className="mb-3">
            <span className="text-lg font-bold text-green-700" dir="ltr">
              ₪{totalPrice.toLocaleString("he-IL")}
            </span>
            <span className="text-xs text-gray-500 ms-2">
              ({bundle.items.length} {bundle.items.length === 1 ? "item" : "items"})
            </span>
          </div>
        )}

        {/* Items Toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-800 mb-3 text-start"
        >
          {expanded ? "▾ Hide items" : "▸ View items in bundle"}
        </button>

        {/* Items List (expandable) */}
        {expanded && bundle.items && bundle.items.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <ul className="space-y-2">
              {bundle.items.map((item) => (
                <li key={item.id} className="text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-8 h-8 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      {(item.estimatedPrice || item.previousPrice) && (
                        <p className="text-xs text-green-700 font-medium">
                          ₪{(item.estimatedPrice || item.previousPrice)?.toLocaleString("he-IL")}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Store Domain */}
        <div className="text-xs text-gray-500 mb-4 mt-auto">
          {t("gifts.retailer")}: {bundle.storeDomain}
        </div>
      </div>
    </div>
  );
}
