"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface EventSearchResult {
  id: string;
  slug: string;
  title: string;
  ownerEmail: string;
  isPublished: boolean;
  isDisabled: boolean;
  createdAt: string;
}

export function EventSearch() {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EventSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/events?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (eventId: string) => {
    const reason = prompt("Reason for disabling:");
    if (!reason) return;

    try {
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          action: "disable",
          reason,
        }),
      });

      if (response.ok) {
        // Refresh results
        handleSearch();
      }
    } catch (error) {
      console.error("Disable error:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{t("admin.eventSearch")}</h2>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          placeholder={t("admin.searchBySlugOrEmail")}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((event) => (
            <div
              key={event.id}
              className="p-4 border border-gray-200 rounded-lg flex justify-between items-start"
            >
              <div>
                <p className="font-semibold text-gray-900">{event.title}</p>
                <p className="text-sm text-gray-600">/{event.slug}</p>
                <p className="text-sm text-gray-600">Owner: {event.ownerEmail}</p>
                <div className="flex gap-2 mt-2">
                  {event.isDisabled && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      DISABLED
                    </span>
                  )}
                  {!event.isPublished && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      DRAFT
                    </span>
                  )}
                </div>
              </div>

              {!event.isDisabled && (
                <button
                  onClick={() => handleDisable(event.id)}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                >
                  {t("admin.disableEvent")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
