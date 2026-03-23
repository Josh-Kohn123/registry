"use client";

import { FetchedMetadata } from "@/types/product";
import Image from "next/image";

interface MetadataPreviewProps {
  metadata: FetchedMetadata;
  isLoading?: boolean;
  onEditTitle?: (title: string) => void;
  onEditImage?: (url: string) => void;
  onEditPrice?: (price: number | undefined) => void;
}

export function MetadataPreview({
  metadata,
  isLoading,
  onEditTitle,
  onEditImage,
  onEditPrice,
}: MetadataPreviewProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Preview
      </h3>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Image Preview */}
          {metadata.image && (
            <div className="relative h-32 w-full bg-gray-100 rounded border border-gray-200 overflow-hidden">
              <Image
                src={metadata.image}
                alt={metadata.title || "Product"}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          {/* Title (Editable) */}
          {metadata.title && (
            <div>
              <label className="text-xs font-medium text-gray-700">Title</label>
              {onEditTitle ? (
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => onEditTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{metadata.title}</p>
              )}
            </div>
          )}

          {/* Price (Editable, Optional) */}
          {metadata.price !== undefined && (
            <div>
              <label className="text-xs font-medium text-gray-700">
                Estimated Price (ILS)
              </label>
              {onEditPrice ? (
                <input
                  type="number"
                  value={metadata.price || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    onEditPrice(val ? parseInt(val) : undefined);
                  }}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">₪{metadata.price}</p>
              )}
            </div>
          )}

          {/* Domain Display */}
          {metadata.domain && (
            <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
              From: <strong>{metadata.domain}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
