"use client";

import { useEffect, useState, use, useMemo } from "react";
import { PublicEventHeader } from "@/components/events/PublicEventHeader";
import { GiftSection } from "@/components/events/GiftSection";
import { FundCard } from "@/components/funds/FundCard";
import { BundleCard } from "@/components/bundles/BundleCard";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilter } from "@/components/products/ProductFilter";
import { PublicEvent } from "@/types/event";
import { Fund } from "@/types/fund";
import { Bundle } from "@/types/bundle";
import { ProductLink, PRODUCT_CATEGORIES } from "@/types/product";
import { useLocale } from "next-intl";
import ReserveButton from "@/components/reservations/ReserveButton";
import { Reservation } from "@/types/reservation";

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
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductLink[]>([]);
  const [filteredBundles, setFilteredBundles] = useState<Bundle[]>([]);
  const [filtersInitialized, setFiltersInitialized] = useState(false);
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
          avatarUrl: eventData.avatarUrl,
          locale: eventData.locale,
        };

        setEventId(eventData.id);
        setEvent(publicEvent);

        // Load funds, bundles, products, and reservations in parallel
        const [fundsRes, bundlesRes, productsRes, reservationsRes] = await Promise.allSettled([
          fetch(`/api/events/${eventData.id}/funds`),
          fetch(`/api/events/${eventData.id}/bundles`),
          fetch(`/api/events/${eventData.id}/products`),
          fetch(`/api/events/${eventData.id}/reservations`),
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

        // Process reservations
        if (reservationsRes.status === "fulfilled" && reservationsRes.value.ok) {
          const reservationsData = await reservationsRes.value.json();
          setReservations(reservationsData);
        }
      } catch {
        setError(locale === "he" ? "שגיאה בטעינת האירוע" : "Error loading event");
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [slug, locale]);

  // --- All derived state and memos must live before any early returns ---

  const displayProducts = filtersInitialized ? filteredProducts : products;
  const displayBundles = filtersInitialized ? filteredBundles : bundles;

  // Group displayProducts by category, in PRODUCT_CATEGORIES order
  const productsByCategory = useMemo(() => {
    const groups: Record<string, ProductLink[]> = {};
    for (const product of displayProducts) {
      const cat = product.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(product);
    }
    return groups;
  }, [displayProducts]);

  const activeCategoryOrder = PRODUCT_CATEGORIES.filter(
    (cat) => (productsByCategory[cat]?.length ?? 0) > 0
  );

  // --- Early returns ---

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

  // Get reservation status for a product or bundle
  const getItemReservationStatus = (productLinkId?: string, bundleId?: string): "AVAILABLE" | "RESERVED" | "PURCHASED_GUEST_CONFIRMED" | "RECEIVED_HOST_CONFIRMED" => {
    const active = reservations.find((r) => {
      if (productLinkId && r.productLinkId === productLinkId) return true;
      if (bundleId && r.bundleId === bundleId) return true;
      return false;
    });
    if (!active) return "AVAILABLE";
    if (active.status === "RESERVED") return "RESERVED";
    if (active.status === "PURCHASED_GUEST_CONFIRMED" || active.status === "RECEIVED_HOST_CONFIRMED") return "PURCHASED_GUEST_CONFIRMED";
    return "AVAILABLE";
  };

  // Get the active reservation object for a product or bundle
  const getActiveReservation = (productLinkId?: string, bundleId?: string): Reservation | null => {
    return reservations.find((r) => {
      if (r.status !== "RESERVED") return false;
      if (productLinkId && r.productLinkId === productLinkId) return true;
      if (bundleId && r.bundleId === bundleId) return true;
      return false;
    }) || null;
  };

  const hasGifts = bundles.length > 0 || products.length > 0;
  const hasDisplayGifts = displayBundles.length > 0 || displayProducts.length > 0;

  // Category labels for section headings
  const categoryHeadings: Record<string, string> = locale === "he"
    ? { kitchen: "מטבח", bedroom: "חדר שינה", bathroom: "חדר אמבטיה", "living-room": "סלון", decor: "עיצוב", electronics: "אלקטרוניקה", outdoor: "חוץ", other: "אחר" }
    : { kitchen: "Kitchen", bedroom: "Bedroom", bathroom: "Bathroom", "living-room": "Living Room", decor: "Decor", electronics: "Electronics", outdoor: "Outdoor", other: "Other" };

  // Helper to render a product card with reservation state
  const renderProductCard = (product: ProductLink) => {
    const status = getItemReservationStatus(product.id);
    const isReserved = status === "RESERVED";
    const isPurchased = status === "PURCHASED_GUEST_CONFIRMED";
    return (
      <div key={product.id} className={`flex flex-col relative rounded-lg overflow-hidden ${isReserved ? "opacity-60 grayscale" : ""} ${isPurchased ? "ring-2 ring-green-500" : ""}`}>
        {isReserved && (
          <div className="absolute inset-0 bg-gray-400/30 z-10 flex items-center justify-center">
            <span className="bg-gray-700 text-white px-4 py-2 rounded-lg text-lg font-bold">
              {locale === "he" ? "שמור" : "Reserved"}
            </span>
          </div>
        )}
        {isPurchased && (
          <div className="absolute inset-0 bg-green-500/20 z-10 flex items-center justify-center">
            <span className="bg-green-600 text-white px-4 py-2 rounded-lg text-lg font-bold">
              {locale === "he" ? "נרכש" : "Purchased"}
            </span>
          </div>
        )}
        <ProductCard product={product} locale={locale} eventId={eventId || undefined} />
        {eventId && !isPurchased && (
          <div className="mt-2 relative z-20">
            <ReserveButton
              eventId={eventId}
              productLinkId={product.id}
              retailerUrl={product.url}
              existingReservation={isReserved ? getActiveReservation(product.id) : null}
            />
          </div>
        )}
      </div>
    );
  };

  // Helper to render a bundle card with reservation state
  const renderBundleCard = (bundle: Bundle) => {
    const status = getItemReservationStatus(undefined, bundle.id);
    const isReserved = status === "RESERVED";
    const isPurchased = status === "PURCHASED_GUEST_CONFIRMED";
    return (
      <div key={`bundle-${bundle.id}`} className={`flex flex-col relative rounded-lg overflow-hidden ${isReserved ? "opacity-60 grayscale" : ""} ${isPurchased ? "ring-2 ring-green-500" : ""}`}>
        {isReserved && (
          <div className="absolute inset-0 bg-gray-400/30 z-10 flex items-center justify-center">
            <span className="bg-gray-700 text-white px-4 py-2 rounded-lg text-lg font-bold">
              {locale === "he" ? "שמור" : "Reserved"}
            </span>
          </div>
        )}
        {isPurchased && (
          <div className="absolute inset-0 bg-green-500/20 z-10 flex items-center justify-center">
            <span className="bg-green-600 text-white px-4 py-2 rounded-lg text-lg font-bold">
              {locale === "he" ? "נרכש" : "Purchased"}
            </span>
          </div>
        )}
        <BundleCard bundle={bundle} eventId={eventId || undefined} />
        {eventId && !isPurchased && (
          <div className="mt-2 relative z-20">
            <ReserveButton
              eventId={eventId}
              bundleId={bundle.id}
              bundleItemUrls={bundle.items.map((item) => item.url)}
              existingReservation={isReserved ? getActiveReservation(undefined, bundle.id) : null}
            />
          </div>
        )}
      </div>
    );
  };

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

      {/* Section 2: Gifts — grouped by category */}
      <GiftSection
        title={locale === "he" ? "מוצרים" : "Products"}
        description={locale === "he" ? "מוצרים מחנויות שלנו" : "Products from our retailers"}
        isEmpty={!hasGifts}
        emptyMessage={locale === "he" ? "עדיין לא הוסיפו מוצרים" : "No products added yet"}
      >
        {hasGifts && (
          <>
            {/* Filter bar */}
            <ProductFilter
              products={products}
              bundles={bundles}
              onFilteredProducts={(fp) => {
                setFilteredProducts(fp);
                if (!filtersInitialized) setFiltersInitialized(true);
              }}
              onFilteredBundles={(fb) => {
                setFilteredBundles(fb);
                if (!filtersInitialized) setFiltersInitialized(true);
              }}
            />

            {!hasDisplayGifts && filtersInitialized ? (
              <p className="text-center text-gray-500 py-8">
                {locale === "he" ? "אין מוצרים התואמים את הסינון" : "No products match your filters"}
              </p>
            ) : (
              <div className="space-y-10">
                {/* Bundles appear first in their own unlabelled group */}
                {displayBundles.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                      {locale === "he" ? "חבילות מתנה" : "Gift Sets"}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayBundles.map(renderBundleCard)}
                    </div>
                  </div>
                )}

                {/* Products grouped by category */}
                {activeCategoryOrder.map((cat) => (
                  <div key={cat}>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                      {categoryHeadings[cat] || cat}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {productsByCategory[cat].map(renderProductCard)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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
