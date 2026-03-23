"use client";

import { useState, useEffect, use } from "react";
import { useLocale } from "next-intl";
import { Reservation } from "@/types/reservation";
import { FundContribution } from "@/types/fund";

interface AddressInfo {
  id: string;
  recipientName: string;
  city: string;
  line1: string;
}

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
  chosenAddressId?: string;
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
  const [addresses, setAddresses] = useState<AddressInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "product" | "fund" | "bundle">("all");

  useEffect(() => {
    const fetchAllGifts = async () => {
      try {
        const allGifts: GiftEntry[] = [];

        // Fetch reservations with product/bundle names
        const reservationsRes = await fetch(`/api/events/${eventId}/reservations?includeItems=true`);
        if (reservationsRes.ok) {
          const reservations = await reservationsRes.json();
          for (const r of reservations) {
            if (r.status === "CANCELLED" || r.status === "EXPIRED") continue;
            const itemTitle = r.product?.title
              || r.bundle?.title
              || (r.productLinkId ? (isHe ? "מוצר שמור" : "Reserved product") : (isHe ? "מתנה קבוצתית" : "Group gift"));
            allGifts.push({
              id: r.id,
              type: r.bundleId ? "bundle" : "product",
              guestName: r.guestName,
              guestContact: r.guestEmail || "",
              itemTitle,
              status: r.status,
              date: r.createdAt ? new Date(r.createdAt).toLocaleDateString(isHe ? "he-IL" : "en-US") : "",
              reservationId: r.id,
              chosenAddressId: r.chosenAddressId || undefined,
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

        // Fetch addresses so we can display chosen address
        try {
          const addressRes = await fetch(`/api/events/${eventId}/addresses`);
          if (addressRes.ok) {
            const addressData = await addressRes.json();
            setAddresses(addressData.map((a: { id: string; recipientName: string; city: string; line1: string }) => ({
              id: a.id,
              recipientName: a.recipientName,
              city: a.city,
              line1: a.line1,
            })));
          }
        } catch {
          // addresses not critical
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

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = isHe
      ? { product: "מוצר", fund: "כספי", bundle: "קבוצתי" }
      : { product: "Product", fund: "Cash", bundle: "Bundle" };
    return labels[type] || type;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "RECEIVED_HOST_CONFIRMED": return "bg-green-50 text-green-700 border-green-200";
      case "PURCHASED_GUEST_CONFIRMED": return "bg-amber-50 text-amber-700 border-amber-200";
      case "RESERVED": return "bg-brand-xlight text-brand border-brand-light";
      case "DECLARED": return "bg-purple-50 text-purple-700 border-purple-200";
      default: return "bg-cream text-pebble border-warm-border";
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-cream flex items-center justify-center ${isHe ? "rtl" : "ltr"}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <p className="text-pebble text-sm">{isHe ? "טוען..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-cream py-10 ${isHe ? "rtl" : "ltr"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <a
          href={`/${locale}/dashboard/events/${eventId}`}
          className="text-pebble hover:text-ink text-sm flex items-center gap-1.5 mb-8 w-fit transition-colors"
        >
          <span aria-hidden>←</span>
          {isHe ? "חזור" : "Back"}
        </a>

        <div className="mb-8">
          <p className="eyebrow mb-2">{isHe ? "ניהול" : "Registry"}</p>
          <h1 className="font-display text-3xl font-semibold text-ink mb-1">
            {isHe ? "מעקב מתנות" : "Gift Tracker"}
          </h1>
          <p className="text-pebble text-sm">
            {isHe ? `${gifts.length} מתנות סה"כ` : `${gifts.length} total gifts`}
          </p>
        </div>

        {/* Filter pills */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {(["all", "product", "fund", "bundle"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filter === f
                  ? "bg-ink text-warm-white border-ink"
                  : "bg-warm-white text-pebble border-warm-border hover:bg-cream"
              }`}
            >
              {f === "all" ? (isHe ? "הכל" : "All") : typeLabel(f)}
            </button>
          ))}
        </div>

        {filteredGifts.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-pebble text-sm">
              {isHe ? "אין מתנות עדיין" : "No gifts yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGifts.map((gift) => (
              <div
                key={gift.id}
                className="card p-4"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-semibold text-ink text-sm">
                        {gift.guestName}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(gift.status)}`}>
                        {statusLabel(gift.status)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cream text-pebble border border-warm-border">
                        {typeLabel(gift.type)}
                      </span>
                    </div>
                    <p className="text-sm text-ink-mid truncate">{gift.itemTitle}</p>
                    {gift.guestContact && (
                      <p className="text-xs text-pebble mt-0.5" dir="ltr">{gift.guestContact}</p>
                    )}
                    {gift.amount && (
                      <p className="text-sm font-semibold text-ink mt-0.5" dir="ltr">
                        ₪{gift.amount.toLocaleString("he-IL")}
                      </p>
                    )}
                    {gift.chosenAddressId && (() => {
                      const addr = addresses.find((a) => a.id === gift.chosenAddressId);
                      return addr ? (
                        <p className="text-xs text-brand mt-0.5">
                          {isHe ? "כתובת משלוח:" : "Ship to:"} {addr.line1}, {addr.city}
                        </p>
                      ) : null;
                    })()}
                    <p className="text-xs text-mist mt-1">{gift.date}</p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {gift.status === "PURCHASED_GUEST_CONFIRMED" && gift.reservationId && (
                      <button
                        onClick={() => handleMarkAsReceived(gift.reservationId!)}
                        className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {isHe ? "אשר קבלה" : "Confirm Received"}
                      </button>
                    )}
                    {gift.status === "RECEIVED_HOST_CONFIRMED" && (
                      <span className="text-green-600 text-xs font-medium">
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
    </div>
  );
}
