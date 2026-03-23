"use client";

import { useLocale } from "next-intl";
import { Reservation } from "@/types/reservation";

interface ReservationStatusProps {
  reservation?: Reservation;
}

export default function ReservationStatus({
  reservation,
}: ReservationStatusProps) {
  const locale = useLocale();
  const isHe = locale === "he";

  if (!reservation) {
    return (
      <span className="text-green-600 text-sm font-medium">
        {isHe ? "זמין" : "Available"}
      </span>
    );
  }

  const statusDisplay: Record<string, React.ReactNode> = {
    AVAILABLE: (
      <span className="text-green-600 text-sm font-medium">
        {isHe ? "זמין" : "Available"}
      </span>
    ),
    RESERVED: (
      <span className="text-blue-600 text-sm font-medium">
        {isHe ? `שמור על ידי ${reservation.guestName}` : `Reserved by ${reservation.guestName}`}
      </span>
    ),
    PURCHASED_GUEST_CONFIRMED: (
      <span className="text-purple-600 text-sm font-medium">
        {isHe ? "נקנה (דווח על ידי אורח)" : "Purchased (Reported by guest)"}
      </span>
    ),
    RECEIVED_HOST_CONFIRMED: (
      <span className="text-green-600 text-sm font-medium">
        {isHe ? "התקבל" : "Received"}
      </span>
    ),
    EXPIRED: (
      <span className="text-gray-500 text-sm font-medium">
        {isHe ? "ההזמנה פקעה" : "Reservation Expired"}
      </span>
    ),
    CANCELLED: (
      <span className="text-gray-500 text-sm font-medium">
        {isHe ? "בוטל" : "Cancelled"}
      </span>
    ),
  };

  return statusDisplay[reservation.status] || <span>{isHe ? "לא ידוע" : "Unknown"}</span>;
}
