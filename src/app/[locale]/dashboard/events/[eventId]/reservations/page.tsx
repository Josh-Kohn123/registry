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
      <h1 className="text-3xl font-bold mb-8">
        {isHe ? "כל ההזמנות" : "All Reservations"}
      </h1>

      <div className="bg-white rounded-lg shadow p-6">
        <ReservationList eventId={eventId} />
      </div>
    </div>
  );
}
