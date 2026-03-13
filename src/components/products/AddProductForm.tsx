"use client";

import { useState } from "react";
import { FetchedMetadata } from "@/types/product";
import { isRetailerWhitelisted, getWhitelistedDomains } from "@/lib/retailer-whitelist";
import { MetadataPreview } from "./MetadataPreview";

interface AddProductFormProps {
  eventId: string;
  onProductAdded?: () => void;
  locale?: string;
}

export function AddProductForm({
  eventId,
  onProductAdded,
  locale = "en",
}: AddProductFormProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<FetchedMetadata | null>(null);
  const [editedMetadata, setEditedMetadata] = useState<FetchedMetadata | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const labels = {
    en: {
      urlPlaceholder: "Paste product URL (e.g., https://foxhome.co.il/product/...)",
      fetchBtn: "Fetch Preview",
      addBtn: "Add Product",
      cancel: "Cancel",
      fetching: "Fetching...",
      saving: "Saving...",
      whitelistedDomains: "Approved retailers",
    },
    he: {
      urlPlaceholder: "הדבק URL של מוצר (למשל, https://foxhome.co.il/product/...)",
      fetchBtn: "אחזר תצוגה מקדימה",
      addBtn: "הוסף מוצר",
      cancel: "ביטול",
      fetching: "אחזור...",
      saving: "שומר...",
      whitelistedDomains: "סוחרים מאושרים",
    },
  };

  const text = labels[locale as keyof typeof labels] || labels.en;

  const handleFetchMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMetadata(null);

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Client-side whitelist validation
    if (!isRetailerWhitelisted(url)) {
      const domains = getWhitelistedDomains();
      setError(
        `This retailer is not approved. Approved retailers: ${domains.join(", ")}`
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to fetch preview");
        return;
      }

      setMetadata(result.data);
      setEditedMetadata(result.data);
    } catch (err) {
      setError("Failed to fetch preview. Please try again.");
      console.error("Metadata fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedMetadata) return;

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/events/${eventId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          title: editedMetadata.title,
          imageUrl: editedMetadata.image,
          estimatedPrice: editedMetadata.price,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Failed to add product");
        return;
      }

      // Reset form
      setUrl("");
      setMetadata(null);
      setEditedMetadata(null);
      onProductAdded?.();
    } catch (err) {
      setError("Failed to add product. Please try again.");
      console.error("Add product error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* URL Input Form */}
      {!metadata && (
        <form onSubmit={handleFetchMetadata} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={text.urlPlaceholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <p className="text-xs text-gray-600 mb-2">{text.whitelistedDomains}:</p>
            <div className="flex flex-wrap gap-2">
              {getWhitelistedDomains().map((domain) => (
                <span
                  key={domain}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {domain}
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {isLoading ? text.fetching : text.fetchBtn}
          </button>
        </form>
      )}

      {/* Metadata Preview and Edit */}
      {metadata && editedMetadata && (
        <form onSubmit={handleAddProduct} className="space-y-4">
          <MetadataPreview
            metadata={editedMetadata}
            onEditTitle={(title) =>
              setEditedMetadata({ ...editedMetadata, title })
            }
            onEditImage={(image) =>
              setEditedMetadata({ ...editedMetadata, image })
            }
            onEditPrice={(price) =>
              setEditedMetadata({ ...editedMetadata, price })
            }
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              {isSaving ? text.saving : text.addBtn}
            </button>
            <button
              type="button"
              onClick={() => {
                setUrl("");
                setMetadata(null);
                setEditedMetadata(null);
                setError(null);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              {text.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
