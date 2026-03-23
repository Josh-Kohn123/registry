"use client";

import { useLocale } from "next-intl";

export default function PurchaseConfirmedPage() {
  const locale = useLocale();
  const isHe = locale === "he";

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${isHe ? "rtl" : "ltr"}`}>
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {isHe ? "הרכישה אושרה!" : "Purchase Confirmed!"}
          </h1>
          <p className="text-gray-600 mb-6">
            {isHe
              ? "תודה רבה! הזוג קיבל הודעה על המתנה שלך."
              : "Thank you! The couple has been notified about your gift."}
          </p>
          <p className="text-sm text-gray-400">
            {isHe ? "אפשר לסגור דף זה." : "You can close this page."}
          </p>
        </div>
      </div>
    </div>
  );
}
