"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "next-intl";
import { Reservation } from "@/types/reservation";
import { PublicAddressReveal } from "@/types/address";

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
  const [mounted, setMounted] = useState(false);

  // Address selection state
  const [addresses, setAddresses] = useState<PublicAddressReveal[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressStep, setAddressStep] = useState(true); // start with address step
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch available addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch(
          `/api/events/${reservation.eventId}/addresses/reveal`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reservationId: reservation.id }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setAddresses(data);
            if (data.length === 1) {
              setSelectedAddressId(data[0].id);
            }
          }
        }
      } catch {
        // No addresses available - skip address step
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [reservation.eventId, reservation.id]);

  const handleSelectAddress = async () => {
    if (!selectedAddressId) return;
    setIsLoading(true);
    setError(null);

    try {
      await fetch(
        `/api/events/${reservation.eventId}/addresses/reveal`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservationId: reservation.id,
            chosenAddressId: selectedAddressId,
          }),
        }
      );
      setAddressStep(false);
    } catch {
      setError(isHe ? "שגיאה בבחירת הכתובת" : "Failed to select address");
    } finally {
      setIsLoading(false);
    }
  };

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
      }, 3000);
    } catch (err) {
      setError(isHe ? "אירעה שגיאה. נסה שוב." : "An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  let modalContent;

  if (confirmed) {
    modalContent = (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
        <div className={`bg-white rounded-lg p-8 w-full max-w-md mx-4 text-center ${isHe ? "rtl" : "ltr"}`}>
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-3 text-green-700">
            {isHe ? "תודה רבה!" : "Thank You!"}
          </h2>
          <p className="text-gray-600 text-lg">
            {isHe
              ? "הרכישה שלך נרשמה בהצלחה! הזוג יקבל התראה."
              : "Your purchase has been recorded! The couple will be notified."}
          </p>
          <div className="mt-4 text-4xl">✓</div>
        </div>
      </div>
    );
  } else if (addressStep && addresses.length > 0 && !loadingAddresses) {
    // Address selection step
    modalContent = (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
        <div className={`bg-white rounded-lg p-6 w-full max-w-md mx-4 ${isHe ? "rtl" : "ltr"}`}>
          <h2 className="text-xl font-bold mb-4">
            {isHe ? "בחר כתובת למשלוח" : "Choose Delivery Address"}
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            {isHe
              ? "בחר לאן לשלוח את המתנה. הכתובת תישלח גם לאימייל שלך."
              : "Choose where to send the gift. The address will also be sent to your email."}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-3 mb-4">
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className={`block p-3 border rounded-lg cursor-pointer transition ${
                  selectedAddressId === addr.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  value={addr.id}
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className="sr-only"
                />
                <p className="font-medium">{addr.recipientName}</p>
                <p className="text-sm text-gray-600">
                  {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}
                </p>
                <p className="text-sm text-gray-600">
                  {addr.city} {addr.postalCode}
                </p>
                {addr.notes && (
                  <p className="text-xs text-gray-500 mt-1">{addr.notes}</p>
                )}
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setAddressStep(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              {isHe ? "דלג" : "Skip"}
            </button>
            <button
              onClick={handleSelectAddress}
              disabled={!selectedAddressId || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
            >
              {isLoading
                ? (isHe ? "שומר..." : "Saving...")
                : (isHe ? "אשר כתובת" : "Confirm Address")}
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    // Confirm purchase step
    modalContent = (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
        <div className={`bg-white rounded-lg p-6 w-full max-w-md mx-4 ${isHe ? "rtl" : "ltr"}`}>
          <h2 className="text-xl font-bold mb-4">
            {isHe ? "אישור רכישה" : "Confirm Purchase"}
          </h2>

          <p className="text-gray-600 mb-6">
            {isHe
              ? "האם השלמת את הרכישה מהחנות? לחץ אישור מתנה כשסיימת."
              : "Have you completed your purchase from the store? Click Confirm Gift when you're done."}
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
                : (isHe ? "אשר מתנה" : "Confirm Gift")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
