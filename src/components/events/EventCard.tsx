"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EventWithOwners } from "@/types/event";

interface EventCardProps {
  event: EventWithOwners;
  onEdit?: (event: EventWithOwners) => void;
}

export function EventCard({ event, onEdit }: EventCardProps) {
  const locale = useLocale();
  const isRtl = locale === "he";

  const formatDate = (dateInput?: string | Date) => {
    if (!dateInput) return "-";
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString(locale === "he" ? "he-IL" : "en-US");
  };

  const eventTypeLabel = {
    wedding: locale === "he" ? "חתונה" : "Wedding",
    engagement: locale === "he" ? "אירוסין" : "Engagement",
    birthday: locale === "he" ? "יום הולדת" : "Birthday",
    other: locale === "he" ? "אחר" : "Other",
  }[event.eventType];

  const visibilityLabel = {
    private: locale === "he" ? "פרטי" : "Private",
    unlisted: locale === "he" ? "לא מופץ" : "Unlisted",
    public: locale === "he" ? "ציבורי" : "Public",
  }[event.visibility];

  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow duration-200 ${isRtl ? "rtl" : "ltr"}`}>
      {event.coverImageUrl && (
        <div className="w-full h-48 bg-cream overflow-hidden">
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold text-ink truncate">{event.title}</h3>
            <p className="text-sm text-pebble mt-0.5">
              {eventTypeLabel}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end shrink-0 ms-3">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                event.isPublished
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-brand-xlight text-brand border border-brand-light"
              }`}
            >
              {event.isPublished
                ? locale === "he" ? "פורסם" : "Published"
                : locale === "he" ? "טיוטה" : "Draft"}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-cream text-pebble border border-warm-border">
              {visibilityLabel}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 text-sm text-pebble mb-5">
          {event.eventDate && (
            <p>
              <span className="font-medium text-ink-mid">
                {locale === "he" ? "תאריך: " : "Date: "}
              </span>
              {formatDate(event.eventDate)}
            </p>
          )}
          <p>
            <span className="font-medium text-ink-mid">
              {locale === "he" ? "קישור: " : "Slug: "}
            </span>
            <code className="text-pebble font-mono text-xs">{event.slug}</code>
          </p>
        </div>

        {/* Quick gift management links */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          <Link href={`/dashboard/events/${event.id}/products`}>
            <span className="inline-block px-2.5 py-1 text-xs bg-brand-xlight text-ink-mid rounded-lg hover:bg-brand-light cursor-pointer transition-colors border border-brand-light/50">
              {locale === "he" ? "🛍️ מוצרים" : "🛍️ Products"}
            </span>
          </Link>
          <Link href={`/dashboard/events/${event.id}/funds`}>
            <span className="inline-block px-2.5 py-1 text-xs bg-brand-xlight text-ink-mid rounded-lg hover:bg-brand-light cursor-pointer transition-colors border border-brand-light/50">
              {locale === "he" ? "💰 קרנות" : "💰 Funds"}
            </span>
          </Link>
          <Link href={`/dashboard/events/${event.id}/bundles`}>
            <span className="inline-block px-2.5 py-1 text-xs bg-brand-xlight text-ink-mid rounded-lg hover:bg-brand-light cursor-pointer transition-colors border border-brand-light/50">
              {locale === "he" ? "🎁 קבוצתיות" : "🎁 Bundles"}
            </span>
          </Link>
          <Link href={`/dashboard/events/${event.id}/reservations`}>
            <span className="inline-block px-2.5 py-1 text-xs bg-brand-xlight text-ink-mid rounded-lg hover:bg-brand-light cursor-pointer transition-colors border border-brand-light/50">
              {locale === "he" ? "📋 הזמנות" : "📋 Reservations"}
            </span>
          </Link>
          <Link href={`/dashboard/events/${event.id}/gifts`}>
            <span className="inline-block px-2.5 py-1 text-xs bg-brand text-white rounded-lg hover:bg-brand-dark cursor-pointer transition-colors">
              {locale === "he" ? "🎯 מעקב" : "🎯 Tracker"}
            </span>
          </Link>
        </div>

        <div className="flex gap-2 justify-between">
          <Link href={`/dashboard/events/${event.id}`}>
            <Button variant="primary" size="sm">
              {locale === "he" ? "ניהול" : "Manage"}
            </Button>
          </Link>
          <Link href={`/events/${event.slug}`}>
            <Button variant="outline" size="sm">
              {locale === "he" ? "צפיה" : "View"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
