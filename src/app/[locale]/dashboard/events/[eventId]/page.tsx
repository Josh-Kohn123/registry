"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
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

  // Registry management sections
  const registrySections = [
    {
      href: `/dashboard/events/${event.id}/products`,
      icon: "🛍️",
      title: locale === "he" ? "מוצרים" : "Products",
      desc: locale === "he" ? "הוסף מוצרים מחנויות" : "Add items from retailers",
    },
    {
      href: `/dashboard/events/${event.id}/funds`,
      icon: "💰",
      title: locale === "he" ? "קרנות כספיות" : "Cash Funds",
      desc: locale === "he" ? "אפשרויות מתנה כספית" : "Flexible cash gift options",
    },
    {
      href: `/dashboard/events/${event.id}/bundles`,
      icon: "🎁",
      title: locale === "he" ? "מתנות חבילה" : "Bundle Gifts",
      desc: locale === "he" ? "מתנות קבוצתיות" : "Group contribution gifts",
    },
    {
      href: `/dashboard/events/${event.id}/addresses`,
      icon: "📍",
      title: locale === "he" ? "כתובות משלוח" : "Addresses",
      desc: locale === "he" ? "כתובות לאורחים" : "Delivery destinations for guests",
    },
    {
      href: `/dashboard/events/${event.id}/reservations`,
      icon: "📋",
      title: locale === "he" ? "מתנות שמורות" : "Reservations",
      desc: locale === "he" ? "מה שמור על ידי אורחים" : "Track what guests have reserved",
    },
  ];

  return (
    <div className={`min-h-screen bg-cream py-10 px-4 sm:px-6 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-5xl mx-auto">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/events")}
            className="text-pebble hover:text-ink transition-colors text-sm flex items-center gap-1.5 mb-6 w-fit"
          >
            <span aria-hidden>←</span>
            {locale === "he" ? "חזור" : "Back"}
          </button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="eyebrow mb-1">{eventTypeLabel}</p>
              <h1 className="font-display text-4xl font-semibold text-ink leading-tight">
                {event.title}
              </h1>
              {event.eventDate && (
                <p className="text-pebble text-sm mt-1">
                  {new Date(event.eventDate).toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                event.isPublished
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-cream text-pebble border-warm-border"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${event.isPublished ? "bg-green-500" : "bg-mist"}`} />
                {event.isPublished
                  ? (locale === "he" ? "פורסם" : "Published")
                  : (locale === "he" ? "טיוטה" : "Draft")}
              </span>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left: meta + publish + actions ── */}
          <div className="w-full lg:w-72 lg:flex-shrink-0 space-y-4 lg:sticky lg:top-6">

            {/* Event meta */}
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-ink text-sm">
                {locale === "he" ? "פרטי האירוע" : "Event Details"}
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-pebble uppercase tracking-wide font-medium mb-0.5">
                    {locale === "he" ? "סוג" : "Type"}
                  </p>
                  <p className="font-medium text-ink">{eventTypeLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-pebble uppercase tracking-wide font-medium mb-0.5">
                    {locale === "he" ? "נראות" : "Visibility"}
                  </p>
                  <p className="font-medium text-ink">{visibilityLabel}</p>
                </div>
                {event.eventDate && (
                  <div>
                    <p className="text-xs text-pebble uppercase tracking-wide font-medium mb-0.5">
                      {locale === "he" ? "תאריך" : "Date"}
                    </p>
                    <p className="font-medium text-ink">
                      {new Date(event.eventDate).toLocaleDateString(locale === "he" ? "he-IL" : "en-US")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-pebble uppercase tracking-wide font-medium mb-0.5">
                    {locale === "he" ? "שפה" : "Language"}
                  </p>
                  <p className="font-medium text-ink">{event.locale}</p>
                </div>
                {event.description && (
                  <div className="pt-3 border-t border-warm-border">
                    <p className="text-xs text-pebble uppercase tracking-wide font-medium mb-1">
                      {locale === "he" ? "תיאור" : "Description"}
                    </p>
                    <p className="text-ink-mid text-xs leading-relaxed">{event.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Publish toggle */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink text-sm">
                    {event.isPublished
                      ? (locale === "he" ? "פורסם" : "Published")
                      : (locale === "he" ? "טיוטה" : "Draft")}
                  </p>
                  <p className="text-pebble text-xs mt-0.5">
                    {event.isPublished
                      ? (locale === "he" ? "גלוי לאורחים" : "Visible to guests")
                      : (locale === "he" ? "מוסתר מאורחים" : "Hidden from guests")}
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

              {/* URL row */}
              <div className="pt-3 border-t border-warm-border">
                <p className="text-xs text-pebble uppercase tracking-wide font-medium mb-2">
                  {locale === "he" ? "קישור ציבורי" : "Public URL"}
                </p>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={publicUrl}
                    readOnly
                    className="flex-1 min-w-0 rounded-xl border border-warm-border bg-cream px-3 py-2 text-xs text-ink-mid focus:outline-none"
                    dir="ltr"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                      copied
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-brand text-white hover:bg-brand-dark"
                    }`}
                  >
                    {copied ? "✓" : (locale === "he" ? "העתק" : "Copy")}
                  </button>
                </div>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-brand hover:text-brand-dark transition-colors"
                >
                  {locale === "he" ? "↗ פתח עמוד" : "↗ Open page"}
                </a>
              </div>
            </div>

            {/* Edit + delete */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => router.push(`/dashboard/events/${event.id}/edit`)}
              >
                {t("editEvent")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                onClick={handleDelete}
              >
                {locale === "he" ? "מחק" : "Delete"}
              </Button>
            </div>
          </div>

          {/* ── Right: registry management ── */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="card p-6">
              <h2 className="font-display text-xl font-semibold text-ink mb-1">
                {locale === "he" ? "בניית הרישום" : "Build Your Registry"}
              </h2>
              <p className="text-pebble text-sm mb-6">
                {locale === "he"
                  ? "הוסיפו מוצרים, קרנות ועוד לרשימת המתנות שלכם"
                  : "Add products, cash funds, and more to your gift list"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {registrySections.map((section) => (
                  <button
                    key={section.href}
                    onClick={() => router.push(section.href)}
                    className="group flex items-start gap-3 p-4 rounded-xl border border-warm-border bg-warm-white hover:bg-brand-xlight hover:border-brand-light transition-all text-start"
                  >
                    <span className="text-2xl mt-0.5 flex-shrink-0">{section.icon}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink text-sm">{section.title}</p>
                      <p className="text-pebble text-xs mt-0.5 leading-snug">{section.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-mist group-hover:text-pebble transition-colors mt-0.5 flex-shrink-0 ms-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Gift Tracker — featured */}
            <button
              onClick={() => router.push(`/dashboard/events/${event.id}/gifts`)}
              className="group w-full card p-6 flex items-center justify-between gap-4 hover:shadow-md transition-all text-start bg-ink border-ink"
            >
              <div>
                <p className="eyebrow mb-1" style={{color: "var(--brand-light)"}}>
                  {locale === "he" ? "מעקב" : "Tracker"}
                </p>
                <h3 className="font-display text-xl font-semibold text-warm-white mb-1">
                  {locale === "he" ? "מעקב מתנות" : "Gift Tracker"}
                </h3>
                <p className="text-warm-white/60 text-sm">
                  {locale === "he" ? "מי נתן מה — כל המתנות במקום אחד" : "Who gave what — all gifts in one place"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center flex-shrink-0 group-hover:bg-brand/30 transition-colors">
                <span className="text-2xl">🎯</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
