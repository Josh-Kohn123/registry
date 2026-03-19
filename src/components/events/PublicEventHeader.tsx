"use client";

import { useLocale } from "next-intl";
import { PublicEvent } from "@/types/event";

interface PublicEventHeaderProps {
  event: PublicEvent;
}

export function PublicEventHeader({ event }: PublicEventHeaderProps) {
  const locale = useLocale();
  const isRtl = locale === "he";

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const eventTypeLabel = {
    wedding: locale === "he" ? "חתונה" : "Wedding",
    engagement: locale === "he" ? "אירוסין" : "Engagement",
    birthday: locale === "he" ? "יום הולדת" : "Birthday",
    other: locale === "he" ? "אחר" : "Other",
  }[event.eventType];

  return (
    <div
      className={`relative w-full ${isRtl ? "rtl" : "ltr"}`}
    >
      {/* Hero Image */}
      {event.coverImageUrl && (
        <div className="w-full h-96 bg-gray-200 overflow-hidden relative">
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content Overlay */}
      <div className={`${event.coverImageUrl ? "relative -mt-32 mx-4" : "py-12 px-4"}`}>
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* Avatar */}
          {event.avatarUrl && (
            <div className="flex justify-center -mt-16 mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img
                  src={event.avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {event.title}
            </h1>

            {event.eventDate && (
              <p className="text-xl text-gray-600 mb-4">
                {formatDate(event.eventDate)}
              </p>
            )}

            <p className="text-lg text-blue-600 font-medium mb-6">
              {eventTypeLabel}
            </p>

            {event.description && (
              <p className="text-base text-gray-700 mb-4 max-w-2xl mx-auto leading-relaxed">
                {event.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
