"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import ReservationList from "@/components/reservations/ReservationList";

interface ReservationsPageProps {
  params: Promise<{
    locale: string;
    eventId: string;
  }>;
}

export default function ReservationsPage({ params }: ReservationsPageProps) {
  const { eventId } = use(params);
  const locale = useLocale();
  const isHe = locale === "he";

  return (
    <div className={`min-h-screen bg-cream py-10 ${isHe ? "rtl" : "ltr"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <a
          href={`/${locale}/dashboard/events/${eventId}`}
          className="text-pebble hover:text-ink text-sm flex items-center gap-1.5 mb-8 w-fit transition-colors"
        >
          <span aria-hidden>←</span>
          {isHe ? "חזור" : "Back"}
        </a>

        <div className="mb-8">
          <p className="eyebrow mb-2">{isHe ? "ניהול" : "Registry"}</p>
          <h1 className="font-display text-3xl font-semibold text-ink">
            {isHe ? "כל ההזמנות" : "All Reservations"}
          </h1>
        </div>

        <div className="card p-6">
          <ReservationList eventId={eventId} />
        </div>
      </div>
    </div>
  );
}
