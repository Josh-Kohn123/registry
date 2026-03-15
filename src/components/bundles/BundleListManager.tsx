"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bundle } from "@/types/bundle";

interface BundleListManagerProps {
  onBundleSelect?: (bundleId: string) => void;
}

export function BundleListManager({ onBundleSelect }: BundleListManagerProps) {
  const t = useTranslations();
  const params = useParams();
  const eventId = params.eventId as string;

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBundles();
  }, [eventId]);

  const fetchBundles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/bundles`);
      if (!response.ok) {
        throw new Error("Failed to fetch bundles");
      }

      const data = await response.json();
      setBundles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (bundleId: string) => {
    if (!confirm(t("common.delete") + "?")) return;

    try {
      const response = await fetch(
        `/api/events/${eventId}/bundles/${bundleId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete bundle");
      }

      setBundles((prev) => prev.filter((b) => b.id !== bundleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (isLoading) {
    return <div>{t("common.loading")}</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (bundles.length === 0) {
    return <div className="text-gray-600">{t("gifts.bundleItems")} not found</div>;
  }

  return (
    <div className="space-y-4">
      {bundles.map((bundle) => (
        <div
          key={bundle.id}
          className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{bundle.title}</h3>
              {bundle.description && (
                <p className="text-gray-600 text-sm mb-2">{bundle.description}</p>
              )}
              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  {t("gifts.bundleItems")}: {bundle.items?.length || 0}
                </p>
                {bundle.items && bundle.items.length > 0 && (
                  <p>
                    {t("gifts.retailer")}: {bundle.storeDomain}
                  </p>
                )}
                {bundle.items && bundle.items.some(i => i.estimatedPrice) && (
                  <p className="font-medium text-green-700">
                    ₪{bundle.items.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0).toLocaleString("he-IL")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onBundleSelect?.(bundle.id)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                {t("common.edit")}
              </button>
              <button
                onClick={() => handleDelete(bundle.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
