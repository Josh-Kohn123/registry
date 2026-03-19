"use client";

import { useState, useEffect } from "react";
import { ProductLink, PRODUCT_CATEGORIES, ProductCategory } from "@/types/product";
import { getRetailerName } from "@/lib/retailer-whitelist";
import Image from "next/image";

/** Decode any HTML entities that may have been stored in product titles */
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

interface ProductListManagerProps {
  eventId: string;
  locale?: string;
  onProductsChanged?: () => void;
}

export function ProductListManager({
  eventId,
  locale = "en",
  onProductsChanged,
}: ProductListManagerProps) {
  const [products, setProducts] = useState<ProductLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ProductLink>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const labels = {
    en: {
      title: "Your Products",
      noProducts: "No products added yet",
      loadingProducts: "Loading products...",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      productTitle: "Title",
      category: "Category",
      noCategory: "No category",
      moveUp: "↑",
      moveDown: "↓",
      deleteConfirm: "Are you sure you want to remove this product?",
      retailer: "Retailer",
      visible: "Visible",
      hidden: "Hidden",
    },
    he: {
      title: "המוצרים שלך",
      noProducts: "עדיין לא התוסף מוצרים",
      loadingProducts: "טוען מוצרים...",
      edit: "ערוך",
      delete: "מחק",
      save: "שמור",
      cancel: "ביטול",
      productTitle: "שם המוצר",
      category: "קטגוריה",
      noCategory: "ללא קטגוריה",
      moveUp: "↑",
      moveDown: "↓",
      deleteConfirm: "האם למחוק מוצר זה?",
      retailer: "חנות",
      visible: "גלוי",
      hidden: "מוסתר",
    },
  };

  const categoryLabels: Record<ProductCategory, string> = {
    kitchen: locale === "he" ? "מטבח" : "Kitchen",
    bedroom: locale === "he" ? "חדר שינה" : "Bedroom",
    bathroom: locale === "he" ? "חדר אמבטיה" : "Bathroom",
    "living-room": locale === "he" ? "סלון" : "Living Room",
    decor: locale === "he" ? "עיצוב" : "Decor",
    electronics: locale === "he" ? "אלקטרוניקה" : "Electronics",
    outdoor: locale === "he" ? "חוץ" : "Outdoor",
    other: locale === "he" ? "אחר" : "Other",
  };

  const text = labels[locale as keyof typeof labels] || labels.en;

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/products`);
      if (!response.ok) throw new Error("Failed to load products");
      const data = await response.json();
      setProducts(data || []);
    } catch (err) {
      setError("Failed to load products");
      console.error("Load products error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [eventId]);

  const handleDelete = async (productId: string) => {
    if (!confirm(text.deleteConfirm)) return;
    setIsDeleting(productId);
    try {
      const response = await fetch(
        `/api/events/${eventId}/products/${productId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete product");
      setProducts(products.filter((p) => p.id !== productId));
      onProductsChanged?.();
    } catch (err) {
      setError("Failed to delete product");
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditStart = (product: ProductLink) => {
    setEditingId(product.id);
    setEditValues({
      title: product.title,
      imageUrl: product.imageUrl,
      category: product.category,
    });
  };

  const handleEditSave = async (productId: string) => {
    setIsSavingEdit(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/events/${eventId}/products/${productId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editValues),
        }
      );
      if (!response.ok) throw new Error("Failed to update product");
      const updated = await response.json();
      setProducts(products.map((p) => (p.id === productId ? updated : p)));
      setEditingId(null);
      onProductsChanged?.();
    } catch (err) {
      setError("Failed to save changes");
      console.error("Edit error:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newProducts = [...products];
    [newProducts[index - 1], newProducts[index]] = [newProducts[index], newProducts[index - 1]];
    setProducts(newProducts);
  };

  const handleMoveDown = (index: number) => {
    if (index === products.length - 1) return;
    const newProducts = [...products];
    [newProducts[index], newProducts[index + 1]] = [newProducts[index + 1], newProducts[index]];
    setProducts(newProducts);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-pebble text-sm py-4">
        <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        {text.loadingProducts}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-ink">{text.title}</h3>
          <span className="text-xs text-pebble bg-cream px-2 py-0.5 rounded-full border border-warm-border">0</span>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-warm-border p-8 text-center">
          <p className="text-pebble text-sm">{text.noProducts}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-ink">{text.title}</h3>
        <span className="text-xs text-pebble bg-cream px-2.5 py-0.5 rounded-full border border-warm-border">
          {products.length}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="border border-warm-border rounded-xl bg-warm-white overflow-hidden"
          >
            {editingId === product.id ? (
              // ── Edit Mode ──
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-pebble uppercase tracking-wide">
                    {text.productTitle}
                  </label>
                  <input
                    type="text"
                    value={editValues.title || ""}
                    onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-warm-border rounded-xl bg-cream text-ink focus:outline-none focus:border-brand/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-pebble uppercase tracking-wide">
                    {text.category}
                  </label>
                  <select
                    value={editValues.category || ""}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        category: (e.target.value as ProductCategory) || undefined,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-sm border border-warm-border rounded-xl bg-cream text-ink focus:outline-none focus:border-brand/50"
                  >
                    <option value="">{text.noCategory}</option>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleEditSave(product.id)}
                    disabled={isSavingEdit}
                    className="px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand-dark disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    {isSavingEdit ? "..." : text.save}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 border border-warm-border rounded-xl hover:bg-cream text-sm text-ink-mid transition-colors"
                  >
                    {text.cancel}
                  </button>
                </div>
              </div>
            ) : (
              // ── View Mode ──
              <div className="flex items-center gap-3 p-3">
                {/* Thumbnail */}
                <div className="relative w-14 h-14 bg-cream rounded-lg flex-shrink-0 overflow-hidden border border-warm-border">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl opacity-30">🎁</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink text-sm leading-snug line-clamp-2">
                    {decodeTitle(product.title)}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-pebble">{getRetailerName(product.retailerDomain)}</span>
                    {product.category && (
                      <>
                        <span className="text-mist text-xs">·</span>
                        <span className="text-xs text-brand">
                          {categoryLabels[product.category as ProductCategory] || product.category}
                        </span>
                      </>
                    )}
                    {product.estimatedPrice && (
                      <>
                        <span className="text-mist text-xs">·</span>
                        <span className="text-xs font-medium text-ink-mid" dir="ltr">
                          ₪{product.estimatedPrice.toLocaleString("he-IL")}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="w-6 h-6 flex items-center justify-center text-xs text-pebble hover:text-ink hover:bg-cream rounded disabled:opacity-30 transition-colors"
                      title="Move up"
                    >
                      {text.moveUp}
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === products.length - 1}
                      className="w-6 h-6 flex items-center justify-center text-xs text-pebble hover:text-ink hover:bg-cream rounded disabled:opacity-30 transition-colors"
                      title="Move down"
                    >
                      {text.moveDown}
                    </button>
                  </div>

                  <div className="w-px h-8 bg-warm-border" />

                  <button
                    onClick={() => handleEditStart(product)}
                    className="px-3 py-1.5 text-xs font-medium border border-warm-border rounded-lg hover:bg-cream text-ink-mid transition-colors"
                  >
                    {text.edit}
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={isDeleting === product.id}
                    className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting === product.id ? "..." : text.delete}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
