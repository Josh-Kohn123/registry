"use client";

import { useLocale } from "next-intl";

interface GiftSectionProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  wide?: boolean;
}

export function GiftSection({
  title,
  description,
  children,
  isEmpty = false,
  emptyMessage,
  wide = false,
}: GiftSectionProps) {
  const locale = useLocale();
  const isRtl = locale === "he";
  const containerClass = wide ? "max-w-6xl" : "max-w-6xl";

  return (
    <section className={`py-12 px-4 sm:px-6 ${isRtl ? "rtl" : "ltr"}`}>
      <div className={`${containerClass} mx-auto`}>
        <div className="mb-7">
          <h2 className="font-display text-2xl font-semibold text-ink mb-1">{title}</h2>
          {description && (
            <p className="text-pebble text-sm">{description}</p>
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
