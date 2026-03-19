"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EventWithOwners } from "@/types/event";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("events");
  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<EventWithOwners | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const isRtl = locale === "he";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        try {
          const response = await fetch(`/api/events/${eventId}`);
          if (response.ok) {
            const eventData = await response.json();
            setEvent(eventData);
          } else {
            router.push("/dashboard/events");
          }
        } catch (error) {
          console.error("Failed to fetch event:", error);
          router.push("/dashboard/events");
        }
      } else {
        router.push("/login");
      }
      setIsLoading(false);
    });
  }, [router, eventId]);

  const handlePublishToggle = async () => {
    if (!event) return;
    try {
      setIsPublishing(true);
      const response = await fetch(`/api/events/${eventId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !event.isPublished }),
      });
      if (response.ok) {
        const updated = await response.json();
        setEvent(updated);
      }
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      alert(locale === "he" ? "שגיאה בשינוי מצב הפרסום" : "Error toggling publish status");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(
      locale === "he"
        ? "האם אתה בטוח שברצונך למחוק אירוע זה?"
        : "Are you sure you want to delete this event?"
    )) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (response.ok) router.push("/dashboard/events");
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert(locale === "he" ? "שגיאה במחיקת האירוע" : "Error deleting event");
    }
  };

  const handleCopyLink = () => {
    if (!event) return;
    const publicUrl = `${window.location.origin}/${locale}/events/${event.slug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <p className="text-pebble text-sm">{locale === "he" ? "טוען..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center">
          <p className="font-display text-xl font-semibold text-ink mb-2">
            {locale === "he" ? "אירוע לא נמצא" : "Event not found"}
          </p>
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/events")}>
            {locale === "he" ? "חזור לאירועים" : "Back to Events"}
          </Button>
        </div>
      </div>
    );
  }

  const eventTypeLabel = {
    wedding: locale === "he" ? "חתונה" : "Wedding",
    engagement: locale === "he" ? "אירוסין" : "Engagement",
    birthday: locale === "he" ? "יום הולדת" : "Birthday",
    other: locale === "he" ? "אחר" : "Other",
  }[event.eventType];

  const visibilityLabel = {
    private: locale === "he" ? "פרטי" : "Private",
    unlisted: locale === "he" ? "לא מופץ" : "Unlisted",
    public: locale === "he" ? "ציבורי" : "Public",
  }[event.visibility];

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/events/${event.slug}`;

  const manageLinks = [
    { href: `/dashboard/events/${event.id}/products`, label: locale === "he" ? "🛍️ מוצרים" : "🛍️ Products" },
    { href: `/dashboard/events/${event.id}/funds`, label: locale === "he" ? "💰 קרנות כספיות" : "💰 Cash Funds" },
    { href: `/dashboard/events/${event.id}/bundles`, label: locale === "he" ? "🎁 מתנות חבילה" : "🎁 Bundle Gifts" },
    { href: `/dashboard/events/${event.id}/addresses`, label: locale === "he" ? "📍 כתובות משלוח" : "📍 Delivery Addresses" },
    { href: `/dashboard/events/${event.id}/reservations`, label: locale === "he" ? "📋 מתנות שמורות" : "📋 Reserved Gifts" },
  ];

  return (
    <div className={`min-h-screen bg-cream py-10 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-2xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-start gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard/events")}
            className="mt-1 text-pebble hover:text-ink transition-colors text-sm flex items-center gap-1.5 shrink-0"
          >
            <span aria-hidden>←</span>
            {locale === "he" ? "חזור" : "Back"}
          </button>
          <div className="flex-1 min-w-0">
            <p className="eyebrow mb-1">{eventTypeLabel}</p>
            <h1 className="font-display text-3xl font-semibold text-ink leading-tight truncate">
              {event.title}
            </h1>
          </div>
        </div>

        {/* ── Event Details Card ── */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>{locale === "he" ? "פרטי האירוע" : "Event Details"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-pebble uppercase tracking-wide font-medium mb-1">
                  {locale === "he" ? "סוג אירוע" : "Type"}
                </p>
                <p className="font-medium text-ink text-sm">{eventTypeLabel}</p>
              </div>
              <div>
                <p className="text-xs text-pebble uppercase tracking-wide font-medium mb-1">
                  {locale === "he" ? "נראות" : "Visibility"}
                </p>
                <p className="font-medium text-ink text-sm">{visibilityLabel}</p>
                <p className="text-xs text-pebble mt-1 leading-relaxed">
                  {event.visibility === "private"
                    ? locale === "he"
                      ? "רק בעלי האירוע יכולים לראות את הדף."
                      : "Only event owners can view this page."
                    : event.visibility === "unlisted"
                    ? locale === "he"
                      ? "רק מי שיש לו את הקישור יכול לראות."
                      : "Only people with the direct link can view."
                    : locale === "he"
                    ? "כל אחד יכול לראות את הדף."
                    : "Anyone can view this page."}
                </p>
              </div>
              {event.eventDate && (
                <div>
                  <p className="text-xs text-pebble uppercase tracking-wide font-medium mb-1">
                    {locale === "he" ? "תאריך" : "Date"}
                  </p>
                  <p className="font-medium text-ink text-sm">
                    {new Date(event.eventDate).toLocaleDateString(locale === "he" ? "he-IL" : "en-US")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-pebble uppercase tracking-wide font-medium mb-1">
                  {locale === "he" ? "שפה" : "Language"}
                </p>
                <p className="font-medium text-ink text-sm">{event.locale}</p>
              </div>
            </div>

            {event.description && (
              <div className="pt-3 border-t border-warm-border">
                <p className="text-xs text-pebble uppercase tracking-wide font-medium mb-2">
                  {locale === "he" ? "תיאור" : "Description"}
                </p>
                <p className="text-ink-mid text-sm leading-relaxed">{event.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Publishing Status Card ── */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>{locale === "he" ? "מצב פרסום" : "Publishing Status"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      event.isPublished ? "bg-green-500" : "bg-mist"
                    }`}
                  />
                  <p className="font-semibold text-ink text-sm">
                    {event.isPublished
                      ? locale === "he" ? "פורסם" : "Published"
                      : locale === "he" ? "טיוטה" : "Draft"}
                  </p>
                </div>
                <p className="text-pebble text-xs">
                  {event.isPublished
                    ? locale === "he" ? "האירוע גלוי לאורחים" : "Visible to guests"
                    : locale === "he" ? "האירוע אינו גלוי לאורחים" : "Not visible to guests"}
                </p>
              </div>
              <Button
                onClick={handlePublishToggle}
                isLoading={isPublishing}
                variant={event.isPublished ? "outline" : "primary"}
                size="sm"
              >
                {event.isPublished ? t("unpublish") : t("publish")}
              </Button>
            </div>

            <div className="pt-4 border-t border-warm-border">
              <p className="text-xs text-pebble mb-3 leading-relaxed">
                {event.isPublished
                  ? locale === "he"
                    ? "כשהאירוע מפורסם, אורחים יכולים לצפות ברשימת המתנות ולשלוח מתנות."
                    : "When published, guests can view your gift registry and send gifts."
                  : locale === "he"
                  ? "כשהאירוע בטיוטה, אף אורח לא יכול לראות את העמוד."
                  : "While in draft, no guest can see your page."}
              </p>
              <p className="text-xs text-pebble uppercase tracking-wide font-medium mb-2">
                {locale === "he" ? "קישור ציבורי" : "Public URL"}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={publicUrl}
                  readOnly
                  className="flex-1 rounded-xl border border-warm-border bg-cream px-4 py-2 text-xs text-ink-mid focus:outline-none"
                  dir="ltr"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    copied
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-brand text-white hover:bg-brand-dark"
                  }`}
                >
                  {copied
                    ? locale === "he" ? "✓ הועתק" : "✓ Copied"
                    : locale === "he" ? "העתק" : "Copy"}
                </button>
              </div>
              <div className="mt-3">
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand hover:text-brand-dark underline underline-offset-2 transition-colors"
                >
                  {locale === "he" ? "↗ פתח עמוד ציבורי" : "↗ Open public page"}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Manage Gifts Card ── */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>{locale === "he" ? "ניהול מתנות" : "Manage Gifts"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {manageLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-warm-border bg-warm-white hover:bg-cream hover:border-ink/20 transition-all text-sm font-medium text-ink text-start"
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => router.push(`/dashboard/events/${event.id}/gifts`)}
                className="sm:col-span-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-brand text-white hover:bg-brand-dark transition-colors text-sm font-medium"
              >
                {locale === "he" ? "🎯 מעקב מתנות — מי נתן מה" : "🎯 Gift Tracker — Who Gave What"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex gap-3 justify-between">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/events/${event.id}/edit`)}
          >
            {t("editEvent")}
          </Button>
          <Button
            variant="ghost"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
          >
            {locale === "he" ? "מחק אירוע" : "Delete Event"}
          </Button>
        </div>
      </div>
    </div>
  );
}
