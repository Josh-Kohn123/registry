"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Reservation, ReservationStatus as ReservationStatusType } from "@/types/reservation";
import ReservationStatus from "./ReservationStatus";

interface ReservationListProps {
  eventId: string;
}

const STATUS_OPTIONS: ReservationStatusType[] = [
  "RESERVED",
  "PURCHASED_GUEST_CONFIRMED",
  "RECEIVED_HOST_CONFIRMED",
  "EXPIRED",
  "CANCELLED",
];

export default function ReservationList({ eventId }: ReservationListProps) {
  const locale = useLocale();
  const isHe = locale === "he";
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ReservationStatusType | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusLabels: Record<string, string> = isHe
    ? {
        ALL: "הכל",
        RESERVED: "שמור",
        PURCHASED_GUEST_CONFIRMED: "נקנה (דווח)",
        RECEIVED_HOST_CONFIRMED: "התקבל",
        EXPIRED: "פקע",
        CANCELLED: "בוטל",
      }
    : {
        ALL: "All",
        RESERVED: "Reserved",
        PURCHASED_GUEST_CONFIRMED: "Purchased (Reported)",
        RECEIVED_HOST_CONFIRMED: "Received",
        EXPIRED: "Expired",
        CANCELLED: "Cancelled",
      };

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/reservations`);
        if (!response.ok) {
          throw new Error("Failed to fetch reservations");
        }
        const data: Reservation[] = await response.json();
        setReservations(data);
      } catch {
        setError(isHe ? "שגיאה בטעינת הזמנות" : "Failed to load reservations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [eventId, isHe]);

  useEffect(() => {
    if (selectedStatus === "ALL") {
      setFilteredReservations(reservations);
    } else {
      setFilteredReservations(
        reservations.filter((r) => r.status === selectedStatus)
      );
    }
  }, [selectedStatus, reservations]);

  const handleMarkAsReceived = async (reservationId: string) => {
    try {
      const response = await fetch(
        `/api/events/${eventId}/reservations/${reservationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "RECEIVED_HOST_CONFIRMED" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update reservation");
      }

      const updated: Reservation = await response.json();
      setReservations(
        reservations.map((r) => (r.id === reservationId ? updated : r))
      );
    } catch {
      alert(isHe ? "שגיאה בעדכון ההזמנה" : "Failed to mark as received");
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm(isHe ? "האם אתה בטוח שברצונך לבטל הזמנה זו?" : "Are you sure you want to cancel this reservation?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/events/${eventId}/reservations/${reservationId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel reservation");
      }

      setReservations(reservations.filter((r) => r.id !== reservationId));
    } catch {
      alert(isHe ? "שגיאה בביטול ההזמנה" : "Failed to cancel reservation");
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{isHe ? "טוען הזמנות..." : "Loading reservations..."}</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {isHe ? "אין הזמנות עדיין" : "No reservations yet"}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          {isHe ? "סנן לפי סטטוס" : "Filter by Status"}
        </label>
        <select
          value={selectedStatus}
          onChange={(e) =>
            setSelectedStatus(e.target.value as ReservationStatusType | "ALL")
          }
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="ALL">{statusLabels.ALL}</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredReservations.map((reservation) => (
          <div
            key={reservation.id}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{reservation.guestName}</p>
                {reservation.guestEmail && (
                  <p className="text-sm text-gray-600" dir="ltr">{reservation.guestEmail}</p>
                )}
              </div>
              <ReservationStatus reservation={reservation} />
            </div>

            <div className="mt-3 text-sm text-gray-600">
              {reservation.expiresAt && (
                <p>
                  {isHe ? "פוקע:" : "Expires:"}{" "}
                  {new Date(reservation.expiresAt).toLocaleString(isHe ? "he-IL" : "en-US")}
                </p>
              )}
              {reservation.confirmedAt && (
                <p>
                  {isHe ? "אושר:" : "Confirmed:"}{" "}
                  {new Date(reservation.confirmedAt).toLocaleString(isHe ? "he-IL" : "en-US")}
                </p>
              )}
            </div>

            {reservation.status === "PURCHASED_GUEST_CONFIRMED" && (
              <button
                onClick={() => handleMarkAsReceived(reservation.id)}
                className="mt-3 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                {isHe ? "סמן כהתקבל" : "Mark as Received"}
              </button>
            )}

            {(reservation.status === "RESERVED" || reservation.status === "PURCHASED_GUEST_CONFIRMED") && (
              <button
                onClick={() => handleCancel(reservation.id)}
                className="mt-3 ms-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                {isHe ? "בטל הזמנה" : "Cancel Reservation"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
