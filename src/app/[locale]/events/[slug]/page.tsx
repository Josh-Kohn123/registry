"use client";

import { useEffect, useState, use } from "react";
import { PublicEventHeader } from "@/components/events/PublicEventHeader";
import { GiftSection } from "@/components/events/GiftSection";
import { FundCard } from "@/components/funds/FundCard";
import { PublicEvent } from "@/types/event";
import { Fund } from "@/types/fund";
import { useLocale } from "next-intl";

interface PublicEventPageProps {
  params: Promise<{ slug: string }>;
}

export default function PublicEventPage({ params }: PublicEventPageProps) {
  const { slug } = use(params);
  const locale = useLocale();
  const isRtl = locale === "he";
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [declaredTotals, setDeclaredTotals] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        // Fetch event by slug via API
        const res = await fetch(`/api/events/by-slug/${slug}`);

        if (!res.ok) {
          if (res.status === 404) {
            setError(locale === "he" ? "אירוע לא נמצא" : "Event not found");
          } else {
            setError(locale === "he" ? "שגיאה בטעינת האירוע" : "Error loading event");
          }
          return;
        }

        const eventData = await res.json();

        if (!eventData.isPublished) {
          setError(
            locale === "he"
              ? "האירוע עדיין לא פורסם"
              : "Event not published yet"
          );
          return;
        }

        const publicEvent: PublicEvent = {
          id: eventData.id,
          title: eventData.title,
          slug: eventData.slug,
          description: eventData.description,
          eventDate: eventData.eventDate
            ? new Date(eventData.eventDate).toISOString()
            : undefined,
          eventType: eventData.eventType,
          coverImageUrl: eventData.coverImageUrl,
          locale: eventData.locale,
        };

        setEventId(eventData.id);
        setEvent(publicEvent);

        // Load funds
        try {
          const fundsResponse = await fetch(`/api/events/${eventData.id}/funds`);
          if (fundsResponse.ok) {
            const fundsData = await fundsResponse.json();
            setFunds(fundsData);

            const totals: Record<string, number> = {};
            for (const fund of fundsData) {
              try {
                const contribResponse = await fetch(
                  `/api/events/${eventData.id}/funds/${fund.id}/contributions`
                );
                if (contribResponse.ok) {
                  const contributions = await contribResponse.json();
                  totals[fund.id] = contributions.reduce(
                    (sum: number, c: any) => sum + c.reportedAmount,
                    0
                  );
                }
              } catch {
                totals[fund.id] = 0;
              }
            }
            setDeclaredTotals(totals);
          }
        } catch (err) {
          console.error("Error loading funds:", err);
        }
      } catch {
        setError(locale === "he" ? "שגיאה בטעינת האירוע" : "Error loading event");
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [slug, locale]);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isRtl ? "rtl" : "ltr"}`}>
        <div className="text-lg text-gray-600">
          {locale === "he" ? "טוען..." : "Loading..."}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isRtl ? "rtl" : "ltr"}`}>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{error}</h1>
          <p className="text-gray-600">
            {locale === "he"
              ? "נסו שוב מאוחר יותר"
              : "Please try again later"}
          </p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className={`min-h-screen bg-white ${isRtl ? "rtl" : "ltr"}`}>
      <PublicEventHeader event={event} />

      {/* Funds Section (Cash-first) */}
      <GiftSection
        title={locale === "he" ? "מתנות כספיות" : "Cash Gifts"}
        description={locale === "he" ? "עזרו לנו עם מתנה כספית" : "Help with a cash gift"}
        isEmpty={funds.length === 0}
        emptyMessage={locale === "he" ? "עדיין לא הוסיפו קרנות כספיות" : "No funds added yet"}
      >
        {funds.length > 0 && (
          <div className="space-y-4">
            {funds.map((fund) => (
              <FundCard
                key={fund.id}
                fund={fund}
                declaredTotal={declaredTotals[fund.id] || 0}
                onContribute={
                  eventId
                    ? async (amount, guestName) => {
                        const response = await fetch(
                          `/api/events/${eventId}/funds/${fund.id}/contribute`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ reportedAmount: amount, guestName }),
                          }
                        );
                        if (response.ok) {
                          setDeclaredTotals({
                            ...declaredTotals,
                            [fund.id]: (declaredTotals[fund.id] || 0) + amount,
                          });
                        }
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </GiftSection>

      {/* Bundles Section */}
      <GiftSection
        title={locale === "he" ? "מתנות קבוצתיות" : "Group Gifts"}
        description={locale === "he" ? "מתנות קבוצתיות - קנו ביחד" : "Group gifts - buy together"}
        isEmpty={true}
        emptyMessage={locale === "he" ? "עדיין לא הוסיפו מתנות קבוצתיות" : "No bundles added yet"}
      />

      {/* Products Section */}
      <GiftSection
        title={locale === "he" ? "מוצרים" : "Products"}
        description={locale === "he" ? "מוצרים בודדים מחנויות שלנו" : "Individual products from our retailers"}
        isEmpty={true}
        emptyMessage={locale === "he" ? "עדיין לא הוסיפו מוצרים" : "No products added yet"}
      />

      <footer className={`border-t border-gray-200 py-12 px-4 ${isRtl ? "rtl" : "ltr"}`}>
        <div className="max-w-3xl mx-auto text-center text-gray-600 text-sm">
          <p>
            {locale === "he"
              ? "זה פותח קישורים חיצוניים לאתרי קמעונות. SimchaList לא מטפל בתשלומים ולא משלח מוצרים."
              : "This event links to external retailer websites. SimchaList does not process payments or ship products."}
          </p>
        </div>
      </footer>
    </div>
  );
}
