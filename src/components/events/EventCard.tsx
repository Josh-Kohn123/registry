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
    <Card className={`overflow-hidden hover:shadow-md transition-shadow ${isRtl ? "rtl" : "ltr"}`}>
      {event.coverImageUrl && (
        <div className="w-full h-48 bg-gray-200 overflow-hidden">
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {locale === "he" ? "סוג אירוע: " : "Type: "}
              {eventTypeLabel}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                event.isPublished
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {event.isPublished
                ? locale === "he"
                  ? "פורסם"
                  : "Published"
                : locale === "he"
                ? "טיוטה"
                : "Draft"}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {visibilityLabel}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-6">
          {event.eventDate && (
            <p>
              <span className="font-medium">
                {locale === "he" ? "תאריך: " : "Date: "}
              </span>
              {formatDate(event.eventDate)}
            </p>
          )}
          <p>
            <span className="font-medium">
              {locale === "he" ? "קישור: " : "Slug: "}
            </span>
            <code className="text-gray-700">{event.slug}</code>
          </p>
        </div>

        <div className="flex gap-2 justify-between">
          <Link href={`/dashboard/events/${event.id}/edit`}>
            <Button variant="secondary" size="sm">
              {locale === "he" ? "עריכה" : "Edit"}
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
