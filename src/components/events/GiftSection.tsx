"use client";

import { useLocale } from "next-intl";

interface GiftSectionProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function GiftSection({
  title,
  description,
  children,
  isEmpty = false,
  emptyMessage,
}: GiftSectionProps) {
  const locale = useLocale();
  const isRtl = locale === "he";

  return (
    <section className={`py-12 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          {description && (
            <p className="text-gray-600">{description}</p>
          )}
        </div>

        {isEmpty ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-600">
              {emptyMessage ||
                (locale === "he"
                  ? "עדיין אין פריטים בקטגוריה זו"
                  : "No items in this section yet")}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
