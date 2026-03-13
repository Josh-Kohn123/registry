"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Reservation } from "@/types/reservation";

interface ConfirmPurchaseModalProps {
  reservation: Reservation;
  onConfirmed: () => void;
}

export default function ConfirmPurchaseModal({
  reservation,
  onConfirmed,
}: ConfirmPurchaseModalProps) {
  const locale = useLocale();
  const isHe = locale === "he";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/events/${reservation.eventId}/reservations/${reservation.id}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || (isHe ? "שגיאה באישור הרכישה" : "Failed to confirm purchase"));
        setIsLoading(false);
        return;
      }

      setConfirmed(true);
      setTimeout(() => {
        onConfirmed();
      }, 2000);
    } catch (err) {
      setError(isHe ? "אירעה שגיאה. נסה שוב." : "An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (confirmed) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={`bg-white rounded-lg p-6 w-full max-w-md mx-4 text-center ${isHe ? "rtl" : "ltr"}`}>
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-bold mb-2">
            {isHe ? "תודה!" : "Thank You!"}
          </h2>
          <p className="text-gray-600">
            {isHe
              ? "הרכישה שלך נרשמה (דווח על ידי אורח). הזוג יקבל התראה."
              : "Your purchase has been recorded (reported by guest). The couple will be notified."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 w-full max-w-md mx-4 ${isHe ? "rtl" : "ltr"}`}>
        <h2 className="text-xl font-bold mb-4">
          {isHe ? "אישור רכישה" : "Confirm Purchase"}
        </h2>

        <p className="text-gray-600 mb-6">
          {isHe
            ? "האם השלמת את הרכישה מהחנות? לחץ אישור כשסיימת."
            : "Have you completed your purchase from the store? Click confirm when you're done."}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onConfirmed}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {isHe ? "עדיין לא" : "Not Yet"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {isLoading
              ? (isHe ? "מאשר..." : "Confirming...")
              : (isHe ? "כן, רכשתי" : "I purchased this")}
          </button>
        </div>
      </div>
    </div>
  );
}
