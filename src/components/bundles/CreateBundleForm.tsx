"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BundleItemInput } from "@/lib/validators";

interface CreateBundleFormProps {
  onSuccess?: () => void;
}

interface BundleItemDraft {
  title: string;
  url: string;
  imageUrl?: string;
}

export function CreateBundleForm({ onSuccess }: CreateBundleFormProps) {
  const t = useTranslations();
  const params = useParams();
  const eventId = params.eventId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bundle-level fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [storeDomain, setStoreDomain] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Items
  const [items, setItems] = useState<BundleItemDraft[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Current item being added/edited
  const [currentItem, setCurrentItem] = useState<BundleItemDraft>({
    title: "",
    url: "",
    imageUrl: "",
  });

  const [showItemForm, setShowItemForm] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddOrUpdateItem = () => {
    if (!currentItem.title || !currentItem.url) {
      setError("Item title and URL are required");
      return;
    }

    if (editingIndex !== null) {
      // Update existing item
      const updated = [...items];
      updated[editingIndex] = { ...currentItem };
      setItems(updated);
      setEditingIndex(null);
    } else {
      // Add new item
      setItems([...items, { ...currentItem }]);
    }

    setCurrentItem({ title: "", url: "", imageUrl: "" });
    setShowItemForm(false);
    setError(null);
  };

  const handleEditItem = (index: number) => {
    setCurrentItem({ ...items[index] });
    setEditingIndex(index);
    setShowItemForm(true);
    setError(null);
  };

  const handleCancelItemEdit = () => {
    setCurrentItem({ title: "", url: "", imageUrl: "" });
    setEditingIndex(null);
    setShowItemForm(false);
    setError(null);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    if (editingIndex === index) {
      handleCancelItemEdit();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!title || !storeDomain || items.length === 0) {
        setError("Bundle title, store domain, and at least one item are required");
        setIsLoading(false);
        return;
      }

      // Upload image if present
      let imageUrl: string | undefined;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }
      }

      const bundleItems: BundleItemInput[] = items.map((item) => ({
        title: item.title,
        url: item.url,
        imageUrl: item.imageUrl || undefined,
      }));

      const response = await fetch(
        `/api/events/${eventId}/bundles`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            targetAmount: 0, // Not used but required by schema for now
            storeDomain,
            imageUrl,
            items: bundleItems,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create bundle");
        return;
      }

      // Reset form
      setTitle("");
      setDescription("");
      setStoreDomain("");
      setImageFile(null);
      setImagePreview(null);
      setItems([]);
      setCurrentItem({ title: "", url: "", imageUrl: "" });
      setShowItemForm(false);

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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("gifts.bundleDescription")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("gifts.storeDomain")}
        </label>
        <input
          type="text"
          value={storeDomain}
          onChange={(e) => setStoreDomain(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., foxhome.co.il"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("gifts.productImage")}
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
          >
            {imageFile ? imageFile.name : "Choose Image"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {t("gifts.bundleDescription") ? "If no image is uploaded, a default image will be used." : ""}
        </p>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium mb-3">{t("gifts.bundleItems")}</h3>

        {/* Items List */}
        {items.length > 0 && (
          <div className="space-y-2 mb-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 truncate">{item.url}</p>
                </div>
                <div className="flex gap-2 ms-2">
                  <button
                    type="button"
                    onClick={() => handleEditItem(index)}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    {t("common.edit") || "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Item Form */}
        {showItemForm ? (
          <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("gifts.itemTitle")}
              </label>
              <input
                type="text"
                value={currentItem.title}
                onChange={(e) => setCurrentItem({ ...currentItem, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t("gifts.itemUrl")}
              </label>
              <input
                type="url"
                value={currentItem.url}
                onChange={(e) => setCurrentItem({ ...currentItem, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddOrUpdateItem}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {editingIndex !== null ? (t("common.save") || "Save") : t("gifts.addItem")}
              </button>
              <button
                type="button"
                onClick={handleCancelItemEdit}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowItemForm(true);
              setEditingIndex(null);
              setCurrentItem({ title: "", url: "", imageUrl: "" });
            }}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mb-4"
          >
            + {t("gifts.addItem")}
          </button>
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
