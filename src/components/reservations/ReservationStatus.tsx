"use client";

import { Reservation } from "@/types/reservation";

interface ReservationStatusProps {
  reservation?: Reservation;
}

export default function ReservationStatus({
  reservation,
}: ReservationStatusProps) {
  if (!reservation) {
    return (
      <span className="text-green-600 text-sm font-medium">Available</span>
    );
  }

  const statusDisplay: Record<string, React.ReactNode> = {
    AVAILABLE: (
      <span className="text-green-600 text-sm font-medium">Available</span>
    ),
    RESERVED: (
      <span className="text-blue-600 text-sm font-medium">
        Reserved by {reservation.guestName}
      </span>
    ),
    PURCHASED_GUEST_CONFIRMED: (
      <span className="text-purple-600 text-sm font-medium">
        Purchased (Reported)
      </span>
    ),
    RECEIVED_HOST_CONFIRMED: (
      <span className="text-green-600 text-sm font-medium">Received</span>
    ),
    EXPIRED: (
      <span className="text-gray-500 text-sm font-medium">
        Reservation Expired
      </span>
    ),
    CANCELLED: (
      <span className="text-gray-500 text-sm font-medium">Cancelled</span>
    ),
  };

  return statusDisplay[reservation.status] || <span>Unknown</span>;
}
