"use client";

import { useState, useEffect } from "react";
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
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ReservationStatusType | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/reservations`);
        if (!response.ok) {
          throw new Error("Failed to fetch reservations");
        }
        const data: Reservation[] = await response.json();
        setReservations(data);
      } catch (err) {
        setError("Failed to load reservations");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [eventId]);

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
    } catch (err) {
      alert("Failed to mark as received");
      console.error(err);
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) {
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
    } catch (err) {
      alert("Failed to cancel reservation");
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading reservations...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No reservations yet
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Filter by Status</label>
        <select
          value={selectedStatus}
          onChange={(e) =>
            setSelectedStatus(e.target.value as ReservationStatusType | "ALL")
          }
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="ALL">All</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
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
                  <p className="text-sm text-gray-600">{reservation.guestEmail}</p>
                )}
              </div>
              <ReservationStatus reservation={reservation} />
            </div>

            <div className="mt-3 text-sm text-gray-600">
              {reservation.expiresAt && (
                <p>
                  Expires: {new Date(reservation.expiresAt).toLocaleString()}
                </p>
              )}
              {reservation.confirmedAt && (
                <p>
                  Confirmed: {new Date(reservation.confirmedAt).toLocaleString()}
                </p>
              )}
            </div>

            {reservation.status === "PURCHASED_GUEST_CONFIRMED" && (
              <button
                onClick={() => handleMarkAsReceived(reservation.id)}
                className="mt-3 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Mark as Received
              </button>
            )}

            {(reservation.status === "RESERVED" || reservation.status === "PURCHASED_GUEST_CONFIRMED") && (
              <button
                onClick={() => handleCancel(reservation.id)}
                className="mt-3 ml-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Cancel Reservation
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
