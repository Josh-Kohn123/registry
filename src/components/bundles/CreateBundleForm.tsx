"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BundleCreateInput, BundleItemInput } from "@/lib/validators";

interface CreateBundleFormProps {
  onSuccess?: () => void;
}

export function CreateBundleForm({ onSuccess }: CreateBundleFormProps) {
  const t = useTranslations();
  const params = useParams();
  const eventId = params.eventId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<BundleCreateInput>>({
    title: "",
    description: "",
    targetAmount: undefined,
    suggestedAmounts: [],
    storeDomain: "",
    imageUrl: "",
    items: [],
  });

  const [currentItem, setCurrentItem] = useState<Partial<BundleItemInput>>({
    title: "",
    description: "",
    estimatedPrice: undefined,
    url: "",
    imageUrl: "",
  });

  const handleFieldChange = (
    field: keyof typeof formData,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemFieldChange = (
    field: keyof typeof currentItem,
    value: any
  ) => {
    setCurrentItem((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addItem = () => {
    if (!currentItem.title || !currentItem.url) {
      setError("Item title and URL are required");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), currentItem as BundleItemInput],
    }));

    setCurrentItem({
      title: "",
      description: "",
      estimatedPrice: undefined,
      url: "",
      imageUrl: "",
    });

    setError(null);
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (
        !formData.title ||
        !formData.targetAmount ||
        !formData.storeDomain ||
        !formData.items ||
        formData.items.length === 0
      ) {
        setError("All fields are required and bundle must have at least one item");
        return;
      }

      const response = await fetch(
        `/api/events/${eventId}/bundles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create bundle");
        return;
      }

      setFormData({
        title: "",
        description: "",
        targetAmount: undefined,
        suggestedAmounts: [],
        storeDomain: "",
        imageUrl: "",
        items: [],
      });

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          {t("gifts.bundleTitle")}
        </label>
        <input
          type="text"
          value={formData.title || ""}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("gifts.bundleDescription")}
        </label>
        <textarea
          value={formData.description || ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("gifts.targetAmount")}
          </label>
          <input
            type="number"
            value={formData.targetAmount || ""}
            onChange={(e) =>
              handleFieldChange("targetAmount", Number(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t("gifts.storeDomain")}
          </label>
          <input
            type="text"
            value={formData.storeDomain || ""}
            onChange={(e) => handleFieldChange("storeDomain", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., foxhome.co.il"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("gifts.productImage")}
        </label>
        <input
          type="url"
          value={formData.imageUrl || ""}
          onChange={(e) => handleFieldChange("imageUrl", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://..."
        />
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium mb-3">{t("gifts.bundleItems")}</h3>

        {/* Add Item Form */}
        <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("gifts.itemTitle")}
            </label>
            <input
              type="text"
              value={currentItem.title || ""}
              onChange={(e) => handleItemFieldChange("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("gifts.itemDescription")}
            </label>
            <textarea
              value={currentItem.description || ""}
              onChange={(e) =>
                handleItemFieldChange("description", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("gifts.itemPrice")}
              </label>
              <input
                type="number"
                value={currentItem.estimatedPrice || ""}
                onChange={(e) =>
                  handleItemFieldChange("estimatedPrice", Number(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t("gifts.itemImage")}
              </label>
              <input
                type="url"
                value={currentItem.imageUrl || ""}
                onChange={(e) =>
                  handleItemFieldChange("imageUrl", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("gifts.itemUrl")}
            </label>
            <input
              type="url"
              value={currentItem.url || ""}
              onChange={(e) => handleItemFieldChange("url", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
              required
            />
          </div>

          <button
            type="button"
            onClick={addItem}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {t("gifts.addItem")}
          </button>
        </div>

        {/* Items List */}
        {formData.items && formData.items.length > 0 && (
          <div className="space-y-2">
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.estimatedPrice && (
                    <p className="text-sm text-gray-600">
                      ₪{item.estimatedPrice}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  {t("common.delete")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
      >
        {isLoading ? t("common.loading") : t("gifts.addBundle")}
      </button>
    </form>
  );
}
