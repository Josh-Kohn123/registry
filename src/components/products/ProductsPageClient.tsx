"use client";

import { useState, useCallback } from "react";
import { AddProductForm } from "./AddProductForm";
import { ProductListManager } from "./ProductListManager";
import { WhitelistRequestForm } from "@/components/dashboard/WhitelistRequestForm";

interface ProductsPageClientProps {
  eventId: string;
  locale: string;
}

export function ProductsPageClient({ eventId, locale }: ProductsPageClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProductAdded = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold text-ink mb-1">
            {locale === "he" ? "הוסף מוצר באמצעות קישור" : "Add a Product by Link"}
          </h2>
          <p className="text-sm text-pebble mb-4">
            {locale === "he"
              ? "העתיקו קישור לדף מוצר מחנות מאושרת ולחצו על 'הוסף'"
              : "Paste a link to any product page from an approved retailer, then click Add"}
          </p>
          <AddProductForm
            eventId={eventId}
            locale={locale}
            onProductAdded={handleProductAdded}
          />
        </div>
        <div className="card p-6">
          <ProductListManager
            key={refreshKey}
            eventId={eventId}
            locale={locale}
          />
        </div>
      </div>

      {/* Request a Store form */}
      <div className="max-w-md">
        <WhitelistRequestForm />
      </div>
    </div>
  );
}
