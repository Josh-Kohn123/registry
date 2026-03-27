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
      {/* Decorative background band */}
      <div className="w-full h-36 sm:h-44 bg-brand-light relative overflow-hidden">
        <div className="absolute inset-0 opacity-40"
          style={{backgroundImage: "radial-gradient(ellipse at 30% 60%, #C17D5C 0%, transparent 55%), radial-gradient(ellipse at 75% 30%, #D4956A 0%, transparent 50%)"}}
        />
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage: "radial-gradient(circle at 50% 120%, #8B6355 0%, transparent 60%)"}}
        />
      </div>

      {/* Content Card — pulled up over background */}
      <div className="relative -mt-14 mx-4 sm:mx-6">
        <div className="max-w-3xl mx-auto card p-8 sm:p-10">
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
          {/* Placeholder circle if no avatar */}
          {!event.avatarUrl && (
            <div className="flex justify-center -mt-14 mb-5">
              <div className="w-20 h-20 rounded-full bg-brand-xlight border-4 border-warm-white shadow-md ring-1 ring-warm-border flex items-center justify-center">
                <span className="text-2xl">💍</span>
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
              <p className="text-ink-mid text-sm sm:text-base max-w-lg mx-auto leading-relaxed mt-4">
                {event.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
