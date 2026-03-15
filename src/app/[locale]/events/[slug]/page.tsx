"use client";

import { useEffect, useState, use } from "react";
import { PublicEventHeader } from "@/components/events/PublicEventHeader";
import { GiftSection } from "@/components/events/GiftSection";
import { FundCard } from "@/components/funds/FundCard";
import { BundleCard } from "@/components/bundles/BundleCard";
import { ProductCard } from "@/components/products/ProductCard";
import { PublicEvent } from "@/types/event";
import { Fund } from "@/types/fund";
import { Bundle } from "@/types/bundle";
import { ProductLink } from "@/types/product";
import { useLocale } from "next-intl";
import ReserveButton from "@/components/reservations/ReserveButton";

interface PublicEventPageProps {
  params: Promise<{ slug: string }>;
}

export default function PublicEventPage({ params }: PublicEventPageProps) {
  const { slug } = use(params);
  const locale = useLocale();
  const isRtl = locale === "he";
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<ProductLink[]>([]);
  const [declaredTotals, setDeclaredTotals] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
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

        // Load funds, bundles, and products in parallel
        const [fundsRes, bundlesRes, productsRes] = await Promise.allSettled([
          fetch(`/api/events/${eventData.id}/funds`),
          fetch(`/api/events/${eventData.id}/bundles`),
          fetch(`/api/events/${eventData.id}/products`),
        ]);

        // Process funds
        if (fundsRes.status === "fulfilled" && fundsRes.value.ok) {
          const fundsData = await fundsRes.value.json();
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
                  (sum: number, c: { reportedAmount: number }) => sum + c.reportedAmount,
                  0
                );
              }
            } catch {
              totals[fund.id] = 0;
            }
          }
          setDeclaredTotals(totals);
        }

        // Process bundles
        if (bundlesRes.status === "fulfilled" && bundlesRes.value.ok) {
          const bundlesData = await bundlesRes.value.json();
          setBundles(bundlesData.filter((b: Bundle) => b.isVisible));
        }

        // Process products
        if (productsRes.status === "fulfilled" && productsRes.value.ok) {
          const productsData = await productsRes.value.json();
          setProducts(productsData.filter((p: ProductLink) => p.isVisible));
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

  const hasGifts = bundles.length > 0 || products.length > 0;

  return (
    <div className={`min-h-screen bg-white ${isRtl ? "rtl" : "ltr"}`}>
      <PublicEventHeader event={event} />

      {/* Section 1: Funds (Cash-first per F00/F02) */}
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
                eventId={eventId || undefined}
                onContribute={
                  eventId
                    ? async (amount, guestName, guestContact) => {
                        const response = await fetch(
                          `/api/events/${eventId}/funds/${fund.id}/contribute`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ reportedAmount: amount, guestName, guestEmail: guestContact }),
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

      {/* Section 2: Gifts (Bundles + Products together, bundles first) */}
      <GiftSection
        title={locale === "he" ? "מוצרים" : "Products"}
        description={locale === "he" ? "מוצרים מחנויות שלנו" : "Products from our retailers"}
        isEmpty={!hasGifts}
        emptyMessage={locale === "he" ? "עדיין לא הוסיפו מוצרים" : "No products added yet"}
      >
        {hasGifts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Bundles first */}
            {bundles.map((bundle) => (
              <div key={`bundle-${bundle.id}`} className="flex flex-col">
                <BundleCard
                  bundle={bundle}
                  eventId={eventId || undefined}
                />
                {eventId && (
                  <div className="mt-2">
                    <ReserveButton
                      eventId={eventId}
                      bundleId={bundle.id}
                      bundleItemUrls={bundle.items.map((item) => item.url)}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Then products */}
            {products.map((product) => (
              <div key={product.id} className="flex flex-col">
                <ProductCard
                  product={product}
                  locale={locale}
                  eventId={eventId || undefined}
                />
                {eventId && (
                  <div className="mt-2">
                    <ReserveButton
                      eventId={eventId}
                      productLinkId={product.id}
                      retailerUrl={product.url}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GiftSection>

      {/* Footer Disclaimer (F02 required) */}
      <footer className={`border-t border-gray-200 py-12 px-4 ${isRtl ? "rtl" : "ltr"}`}>
        <div className="max-w-3xl mx-auto text-center text-gray-600 text-sm">
          <p>
            {locale === "he"
              ? "לחיצה על מתנות תעביר אותך לאתרי קמעונאות חיצוניים. SimchaList לא מוכר, לא משלח ולא מעבד תשלומים."
              : "Clicking gifts takes you to external retailer websites. This registry platform does not sell or ship products."}
          </p>
        </div>
      </footer>
    </div>
  );
}
