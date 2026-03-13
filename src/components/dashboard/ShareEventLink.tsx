"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ShareEventLinkProps {
  eventSlug: string;
  eventTitle: string;
  locale: string;
}

export function ShareEventLink({ eventSlug, eventTitle, locale }: ShareEventLinkProps) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  const eventUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/events/${eventSlug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-4">{t("dashboardMetrics.shareEvent")}</h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={eventUrl}
          readOnly
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
        />
        <button
          onClick={handleCopy}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            copied
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-900 hover:bg-gray-300"
          }`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          Facebook
        </a>
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out our gift registry: ${eventUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}
