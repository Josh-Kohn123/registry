"use client";

import { useState, useEffect } from "react";
import { ProductLink } from "@/types/product";
import { getRetailerName } from "@/lib/retailer-whitelist";
import Image from "next/image";

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
      title: "Manage Products",
      noProducts: "No products added yet",
      loadingProducts: "Loading products...",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      productTitle: "Title",
      estimatedPrice: "Estimated Price (ILS)",
      moveUp: "↑",
      moveDown: "↓",
      deleteConfirm: "Are you sure?",
      retailer: "Retailer",
    },
    he: {
      title: "ניהול מוצרים",
      noProducts: "עדיין לא התוסף מוצרים",
      loadingProducts: "טוען מוצרים...",
      edit: "ערוך",
      delete: "מחק",
      save: "שמור",
      cancel: "ביטול",
      productTitle: "שם המוצר",
      estimatedPrice: "מחיר משוער (₪)",
      moveUp: "↑",
      moveDown: "↓",
      deleteConfirm: "בטוח?",
      retailer: "סוחר",
    },
  };

  const text = labels[locale as keyof typeof labels] || labels.en;

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/products`);
      if (!response.ok) {
        throw new Error("Failed to load products");
      }
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

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

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
      estimatedPrice: product.estimatedPrice,
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

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

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
    [newProducts[index - 1], newProducts[index]] = [
      newProducts[index],
      newProducts[index - 1],
    ];
    setProducts(newProducts);
  };

  const handleMoveDown = (index: number) => {
    if (index === products.length - 1) return;
    const newProducts = [...products];
    [newProducts[index], newProducts[index + 1]] = [
      newProducts[index + 1],
      newProducts[index],
    ];
    setProducts(newProducts);
  };

  if (isLoading) {
    return <div className="text-gray-500">{text.loadingProducts}</div>;
  }

  if (products.length === 0) {
    return <div className="text-gray-500">{text.noProducts}</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">{text.title}</h3>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="border border-gray-200 rounded-lg p-4 bg-white"
          >
            {editingId === product.id ? (
              // Edit Mode
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {text.productTitle}
                  </label>
                  <input
                    type="text"
                    value={editValues.title || ""}
                    onChange={(e) =>
                      setEditValues({ ...editValues, title: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={editValues.imageUrl || ""}
                    onChange={(e) =>
                      setEditValues({ ...editValues, imageUrl: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {text.estimatedPrice}
                  </label>
                  <input
                    type="number"
                    value={editValues.estimatedPrice || ""}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        estimatedPrice: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSave(product.id)}
                    disabled={isSavingEdit}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm"
                  >
                    {text.save}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                  >
                    {text.cancel}
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex gap-4">
                {product.imageUrl && (
                  <div className="relative w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {product.title}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {text.retailer}: {getRetailerName(product.retailerDomain)}
                  </p>
                  {product.estimatedPrice && (
                    <p className="text-sm font-medium text-gray-900">
                      ₪{product.estimatedPrice}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  {/* Move buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded"
                      title={`Move ${product.title} up`}
                    >
                      {text.moveUp}
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === products.length - 1}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded"
                      title={`Move ${product.title} down`}
                    >
                      {text.moveDown}
                    </button>
                  </div>

                  {/* Edit/Delete buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditStart(product)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {text.edit}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={isDeleting === product.id}
                      className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
                    >
                      {text.delete}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
