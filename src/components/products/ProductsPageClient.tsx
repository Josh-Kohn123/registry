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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {locale === "he" ? "הוסף מוצר חדש" : "Add New Product"}
          </h2>
          <AddProductForm
            eventId={eventId}
            locale={locale}
            onProductAdded={handleProductAdded}
          />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
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
