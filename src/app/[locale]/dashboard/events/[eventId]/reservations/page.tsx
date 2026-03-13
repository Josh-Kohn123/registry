import { Metadata } from "next";
import ReservationList from "@/components/reservations/ReservationList";

interface ReservationsPageProps {
  params: {
    locale: string;
    eventId: string;
  };
}

export const metadata: Metadata = {
  title: "Reservations",
  description: "Manage reservations for your event",
};

export default function ReservationsPage({
  params: { locale, eventId },
}: ReservationsPageProps) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">All Reservations</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <ReservationList eventId={eventId} />
      </div>
    </div>
  );
}
