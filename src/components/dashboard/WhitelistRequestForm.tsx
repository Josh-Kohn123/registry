"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

export function WhitelistRequestForm() {
  const locale = useLocale();
  const isHe = locale === "he";
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/whitelist-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, storeUrl, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit request");
        return;
      }

      // Also open mailto as fallback to ensure email is sent
      if (data.mailtoLink) {
        window.open(data.mailtoLink, "_blank");
      }

      setSuccess(true);
      setStoreName("");
      setStoreUrl("");
      setReason("");
    } catch {
      setError(isHe ? "שגיאה בשליחת הבקשה" : "Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 font-medium">
          {isHe ? "הבקשה נשלחה בהצלחה! נבדוק ונחזור אליך." : "Request submitted! We'll review it and get back to you."}
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-2 text-sm text-green-700 underline"
        >
          {isHe ? "שלח בקשה נוספת" : "Submit another request"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-2">
        {isHe ? "בקש הוספת חנות" : "Request a Store"}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        {isHe
          ? "החנות שאתם מחפשים לא ברשימה? שלחו לנו בקשה ונוסיף אותה."
          : "Can't find the store you're looking for? Request it and we'll add it."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            {isHe ? "שם החנות *" : "Store Name *"}
          </label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder={isHe ? "לדוגמה: שופרסל" : "e.g., SuperPharm"}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {isHe ? "כתובת האתר *" : "Store URL *"}
          </label>
          <input
            type="url"
            value={storeUrl}
            onChange={(e) => setStoreUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            dir="ltr"
            placeholder="https://www.example.co.il"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {isHe ? "סיבה (אופציונלי)" : "Reason (optional)"}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={2}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
        >
          {isLoading
            ? (isHe ? "שולח..." : "Sending...")
            : (isHe ? "שלח בקשה" : "Send Request")}
        </button>
      </form>
    </div>
  );
}
