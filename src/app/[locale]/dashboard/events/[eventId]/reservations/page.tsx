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
    <div className={`max-w-4xl mx-auto py-8 px-4 ${isHe ? "rtl" : "ltr"}`}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          {isHe ? "כל ההזמנות" : "All Reservations"}
        </h1>
        <a
          href={`/${locale}/dashboard/events/${eventId}`}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {isHe ? "חזור" : "Back"}
        </a>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ReservationList eventId={eventId} />
      </div>
    </div>
  );
}
