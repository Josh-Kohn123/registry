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
    <section className={`py-14 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="font-display text-3xl font-semibold text-ink mb-2">{title}</h2>
          {description && (
            <p className="text-pebble">{description}</p>
          )}
        </div>

        {isEmpty ? (
          <div className="rounded-2xl border-2 border-dashed border-warm-border p-10 text-center bg-warm-white">
            <p className="text-pebble text-sm">
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
