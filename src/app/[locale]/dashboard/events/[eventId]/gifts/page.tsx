"use client";

import { useState, useEffect, use } from "react";
import { useLocale } from "next-intl";
import { Reservation } from "@/types/reservation";
import { FundContribution } from "@/types/fund";

interface GiftEntry {
  id: string;
  type: "product" | "fund" | "bundle";
  guestName: string;
  guestContact: string;
  itemTitle: string;
  amount?: number;
  status: string;
  date: string;
  reservationId?: string;
}

interface GiftsPageProps {
  params: Promise<{
    locale: string;
    eventId: string;
  }>;
}

export default function GiftTrackingPage({ params }: GiftsPageProps) {
  const { eventId } = use(params);
  const locale = useLocale();
  const isHe = locale === "he";
  const [gifts, setGifts] = useState<GiftEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "product" | "fund" | "bundle">("all");

  useEffect(() => {
    const fetchAllGifts = async () => {
      try {
        const allGifts: GiftEntry[] = [];

        // Fetch reservations (products + bundles)
        const reservationsRes = await fetch(`/api/events/${eventId}/reservations`);
        if (reservationsRes.ok) {
          const reservations: Reservation[] = await reservationsRes.json();
          for (const r of reservations) {
            if (r.status === "CANCELLED" || r.status === "EXPIRED") continue;
            allGifts.push({
              id: r.id,
              type: r.bundleId ? "bundle" : "product",
              guestName: r.guestName,
              guestContact: r.guestEmail || "",
              itemTitle: r.productLinkId
                ? (isHe ? "מוצר שמור" : "Reserved product")
                : (isHe ? "מתנה קבוצתית" : "Group gift"),
              status: r.status,
              date: r.createdAt ? new Date(r.createdAt).toLocaleDateString(isHe ? "he-IL" : "en-US") : "",
              reservationId: r.id,
            });
          }
        }

        // Fetch funds and their contributions
        const fundsRes = await fetch(`/api/events/${eventId}/funds`);
        if (fundsRes.ok) {
          const funds = await fundsRes.json();
          for (const fund of funds) {
            try {
              const contribRes = await fetch(
                `/api/events/${eventId}/funds/${fund.id}/contributions`
              );
              if (contribRes.ok) {
                const contributions: FundContribution[] = await contribRes.json();
                for (const c of contributions) {
                  allGifts.push({
                    id: c.id,
                    type: "fund",
                    guestName: c.guestName || (isHe ? "אנונימי" : "Anonymous"),
                    guestContact: c.guestEmail || "",
                    itemTitle: fund.title,
                    amount: c.reportedAmount,
                    status: "DECLARED",
                    date: c.createdAt ? new Date(c.createdAt).toLocaleDateString(isHe ? "he-IL" : "en-US") : "",
                  });
                }
              }
            } catch {
              // skip fund if contributions endpoint fails
            }
          }
        }

        // Sort by date (newest first)
        allGifts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setGifts(allGifts);
      } catch (err) {
        console.error("Failed to fetch gifts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllGifts();
  }, [eventId, isHe]);

  const handleMarkAsReceived = async (reservationId: string) => {
    try {
      const response = await fetch(
        `/api/events/${eventId}/reservations/${reservationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "RECEIVED_HOST_CONFIRMED" }),
        }
      );

      if (response.ok) {
        setGifts(
          gifts.map((g) =>
            g.reservationId === reservationId
              ? { ...g, status: "RECEIVED_HOST_CONFIRMED" }
              : g
          )
        );
      }
    } catch {
      alert(isHe ? "שגיאה בעדכון" : "Failed to update");
    }
  };

  const filteredGifts = filter === "all" ? gifts : gifts.filter((g) => g.type === filter);

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = isHe
      ? {
          RESERVED: "שמור",
          PURCHASED_GUEST_CONFIRMED: "נקנה (דווח על ידי אורח)",
          RECEIVED_HOST_CONFIRMED: "התקבל",
          DECLARED: "הצהרה כספית",
        }
      : {
          RESERVED: "Reserved",
          PURCHASED_GUEST_CONFIRMED: "Purchased (Guest reported)",
          RECEIVED_HOST_CONFIRMED: "Received",
          DECLARED: "Cash declaration",
        };
    return labels[status] || status;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "RECEIVED_HOST_CONFIRMED":
        return "bg-green-100 text-green-800";
      case "PURCHASED_GUEST_CONFIRMED":
        return "bg-yellow-100 text-yellow-800";
      case "RESERVED":
        return "bg-blue-100 text-blue-800";
      case "DECLARED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = isHe
      ? { product: "מוצר", fund: "כספי", bundle: "קבוצתי" }
      : { product: "Product", fund: "Cash", bundle: "Bundle" };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className={`max-w-5xl mx-auto py-8 px-4 text-center ${isHe ? "rtl" : "ltr"}`}>
        {isHe ? "טוען..." : "Loading..."}
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto py-8 px-4 ${isHe ? "rtl" : "ltr"}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {isHe ? "מעקב מתנות" : "Gift Tracker"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isHe
              ? `${gifts.length} מתנות סה"כ`
              : `${gifts.length} total gifts`}
          </p>
        </div>
        <a
          href={`/${locale}/dashboard/events/${eventId}`}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {isHe ? "חזור" : "Back"}
        </a>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {(["all", "product", "fund", "bundle"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f === "all"
              ? isHe ? "הכל" : "All"
              : typeLabel(f)}
          </button>
        ))}
      </div>

      {filteredGifts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {isHe ? "אין מתנות עדיין" : "No gifts yet"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGifts.map((gift) => (
            <div
              key={gift.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {gift.guestName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(gift.status)}`}>
                      {statusLabel(gift.status)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {typeLabel(gift.type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{gift.itemTitle}</p>
                  {gift.guestContact && (
                    <p className="text-sm text-gray-500 mt-1" dir="ltr">
                      {gift.guestContact}
                    </p>
                  )}
                  {gift.amount && (
                    <p className="text-sm font-medium text-gray-700 mt-1">
                      {isHe ? `₪${gift.amount}` : `${gift.amount} ILS`}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{gift.date}</p>
                </div>

                <div className="flex gap-2">
                  {gift.status === "PURCHASED_GUEST_CONFIRMED" && gift.reservationId && (
                    <button
                      onClick={() => handleMarkAsReceived(gift.reservationId!)}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {isHe ? "אשר קבלה" : "Confirm Received"}
                    </button>
                  )}
                  {gift.status === "RECEIVED_HOST_CONFIRMED" && (
                    <span className="text-green-600 text-sm font-medium">
                      {isHe ? "התקבל ✓" : "Received ✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
