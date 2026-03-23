"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Reservation } from "@/types/reservation";
import GuestReservationForm from "./GuestReservationForm";

interface ReserveButtonProps {
  eventId: string;
  productLinkId?: string;
  bundleId?: string;
  retailerUrl?: string;
  bundleItemUrls?: string[]; // For bundles: open all item URLs
  isDisabled?: boolean;
  existingReservation?: Reservation | null; // For returning guests with active reservation
}

export default function ReserveButton({
  eventId,
  productLinkId,
  bundleId,
  retailerUrl,
  bundleItemUrls,
  isDisabled = false,
  existingReservation = null,
}: ReserveButtonProps) {
  const locale = useLocale();
  const isHe = locale === "he";
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(existingReservation);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReserve = async (guestName: string, guestEmail: string, guestMessage?: string) => {
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
            guestMessage,
            locale,
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
      setSuccessEmail(guestEmail);

      // For bundles: open all item URLs sequentially so guest can add each to cart
      if (bundleItemUrls && bundleItemUrls.length > 0) {
        for (let i = 0; i < bundleItemUrls.length; i++) {
          if (i === 0) {
            window.open(bundleItemUrls[i], "_blank");
          } else {
            setTimeout(() => {
              window.open(bundleItemUrls[i], "_blank");
            }, i * 800);
          }
        }
      } else if (retailerUrl) {
        // For individual products: open the single product URL
        window.open(retailerUrl, "_blank");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show success message after reservation is created
  if (successEmail && reservation) {
    return (
      <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <div className="text-green-600 text-lg mb-1">✓</div>
        <p className="text-sm font-medium text-green-800">
          {isHe ? "השריון אושר!" : "Reservation confirmed!"}
        </p>
        <p className="text-xs text-green-700 mt-1">
          {isHe
            ? `בדוק את האימייל שלך ב-${successEmail} לפרטי משלוח וקישור לאישור רכישה.`
            : `Check your email at ${successEmail} for shipping details and purchase confirmation.`}
        </p>
      </div>
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

  // Returning guest with existing reservation — show status
  if (existingReservation && reservation) {
    return (
      <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
        <p className="text-sm font-medium text-yellow-800">
          {isHe ? "שריון פעיל" : "Reserved"}
        </p>
        <p className="text-xs text-yellow-700 mt-1">
          {isHe
            ? "בדוק את האימייל שלך לאישור הרכישה."
            : "Check your email to confirm your purchase."}
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      disabled={isDisabled}
      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
    >
      {isHe ? "שריין וקנה בחנות" : "Reserve & Go to Store"}
    </button>
  );
}
