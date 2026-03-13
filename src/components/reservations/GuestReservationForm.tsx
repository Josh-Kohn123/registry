"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

interface GuestReservationFormProps {
  onReserve: (guestName: string, guestEmail?: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: string | null;
}

export default function GuestReservationForm({
  onReserve,
  onCancel,
  isLoading,
  error,
}: GuestReservationFormProps) {
  const locale = useLocale();
  const isHe = locale === "he";
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const hasContact = guestEmail.trim() || guestPhone.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !hasContact) return;
    const contactInfo = guestEmail.trim() || guestPhone.trim();
    onReserve(guestName, contactInfo || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 w-full max-w-md mx-4 ${isHe ? "rtl" : "ltr"}`}>
        <h2 className="text-xl font-bold mb-4">
          {isHe ? "שריין מתנה זו" : "Reserve This Item"}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {isHe ? "השם שלך *" : "Your Name *"}
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={isHe ? "הכנס את שמך" : "Enter your name"}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {isHe ? "אימייל *" : "Email *"}
            </label>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="your@email.com"
              dir="ltr"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {isHe ? "טלפון" : "Phone"}
            </label>
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder={isHe ? "050-1234567" : "050-1234567"}
              dir="ltr"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {isHe
                ? "נדרש אימייל או טלפון כדי שהזוג יוכלו ליצור קשר"
                : "Email or phone required so the couple can reach you"}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {isHe ? "ביטול" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={!guestName.trim() || !hasContact || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading
                ? (isHe ? "שומר..." : "Reserving...")
                : (isHe ? "שריין" : "Reserve")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
