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
    <div className={`relative w-full ${isRtl ? "rtl" : "ltr"}`}>
      {/* Hero Image */}
      {event.coverImageUrl ? (
        <div className="w-full h-72 sm:h-96 bg-cream overflow-hidden relative">
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {/* soft gradient fade at bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream/60" />
        </div>
      ) : (
        /* Decorative header band when no cover photo */
        <div className="w-full h-40 bg-brand-light relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{backgroundImage: "radial-gradient(circle at 60% 50%, #C17D5C 0%, transparent 70%)"}} />
        </div>
      )}

      {/* Content Card — pulled up over hero */}
      <div className={`${event.coverImageUrl ? "relative -mt-28 mx-4" : "relative -mt-10 mx-4"}`}>
        <div className="max-w-2xl mx-auto card p-8 sm:p-10">
          {/* Avatar */}
          {event.avatarUrl && (
            <div className="flex justify-center -mt-16 mb-5">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-warm-white shadow-md ring-1 ring-warm-border">
                <img
                  src={event.avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          <div className="text-center">
            <p className="eyebrow mb-3">{eventTypeLabel}</p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink mb-3 leading-tight">
              {event.title}
            </h1>

            {event.eventDate && (
              <p className="text-pebble text-base mb-4">
                {formatDate(event.eventDate)}
              </p>
            )}

            {event.description && (
              <p className="text-ink-mid text-base max-w-lg mx-auto leading-relaxed mt-4">
                {event.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
