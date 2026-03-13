"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Reservation } from "@/types/reservation";
import GuestReservationForm from "./GuestReservationForm";
import ConfirmPurchaseModal from "./ConfirmPurchaseModal";

interface ReserveButtonProps {
  eventId: string;
  productLinkId?: string;
  bundleId?: string;
  retailerUrl?: string;
  isDisabled?: boolean;
}

export default function ReserveButton({
  eventId,
  productLinkId,
  bundleId,
  retailerUrl,
  isDisabled = false,
}: ReserveButtonProps) {
  const locale = useLocale();
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReserve = async (guestName: string, guestEmail?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/events/${eventId}/reservations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestName,
            guestEmail,
            productLinkId,
            bundleId,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create reservation");
        setIsLoading(false);
        return;
      }

      const data: Reservation = await response.json();
      setReservation(data);
      setShowForm(false);

      // Open retailer link in new tab
      if (retailerUrl) {
        window.open(retailerUrl, "_blank");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPurchase = () => {
    setReservation(null);
  };

  if (reservation) {
    return (
      <ConfirmPurchaseModal
        reservation={reservation}
        onConfirmed={handleConfirmPurchase}
      />
    );
  }

  if (showForm) {
    return (
      <GuestReservationForm
        onReserve={handleReserve}
        onCancel={() => setShowForm(false)}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      disabled={isDisabled}
      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
    >
      {locale === "he" ? "שריין וקנה בחנות" : "Reserve & Go to Store"}
    </button>
  );
}
