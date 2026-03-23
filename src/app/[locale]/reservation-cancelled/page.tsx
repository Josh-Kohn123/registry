"use client";

import { useLocale } from "next-intl";

export default function ReservationCancelledPage() {
  const locale = useLocale();
  const isHe = locale === "he";

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${isHe ? "rtl" : "ltr"}`}>
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {isHe ? "השריון בוטל" : "Reservation Cancelled"}
          </h1>
          <p className="text-gray-600 mb-6">
            {isHe
              ? "השריון שלך בוטל. הפריט זמין כעת לאחרים."
              : "Your reservation has been cancelled. The item is now available for others."}
          </p>
          <p className="text-sm text-gray-400">
            {isHe ? "אפשר לסגור דף זה." : "You can close this page."}
          </p>
        </div>
      </div>
    </div>
  );
}
