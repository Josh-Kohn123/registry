"use client";

import { useState } from "react";
import { Reservation } from "@/types/reservation";

interface ConfirmPurchaseModalProps {
  reservation: Reservation;
  onConfirmed: () => void;
}

export default function ConfirmPurchaseModal({
  reservation,
  onConfirmed,
}: ConfirmPurchaseModalProps) {
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
        setError(data.error || "Failed to confirm purchase");
        setIsLoading(false);
        return;
      }

      setConfirmed(true);
      setTimeout(() => {
        onConfirmed();
      }, 2000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (confirmed) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-bold mb-2">Thank You!</h2>
          <p className="text-gray-600">
            Your purchase has been recorded. The couple will be notified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Confirm Purchase</h2>

        <p className="text-gray-600 mb-6">
          Have you completed your purchase from the store? Click confirm when
          you're done.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onConfirmed}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Not Yet
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? "Confirming..." : "Yes, I Purchased It"}
          </button>
        </div>
      </div>
    </div>
  );
}
