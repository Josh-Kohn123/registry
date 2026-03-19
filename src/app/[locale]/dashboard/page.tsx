"use client";

import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { EventWithOwners } from "@/types/event";
import { EventCard } from "@/components/events/EventCard";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const et = useTranslations("events");
  const locale = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventWithOwners[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        try {
          const response = await fetch("/api/events");
          if (response.ok) {
            const eventsData = await response.json();
            setEvents(eventsData);
          }
        } catch (error) {
          console.error("Failed to fetch events:", error);
        }
      } else {
        router.push("/login");
      }
      setIsLoading(false);
    });
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <p className="text-pebble text-sm">{t("welcome")}</p>
        </div>
      </div>
    );
  }

  const isRtl = locale === "he";
  const publishedCount = events.filter((e) => e.isPublished).length;
  const draftCount = events.length - publishedCount;

  return (
    <div className={`min-h-screen bg-cream py-10 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="eyebrow mb-2">
              {locale === "he" ? "דשבורד" : "Dashboard"}
            </p>
            <h1 className="font-display text-4xl font-semibold text-ink mb-1.5">
              {t("welcome")}
            </h1>
            <p className="text-pebble text-sm">
              {user?.email}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/profile")}
          >
            {locale === "he" ? "הגדרות פרופיל" : "Profile Settings"}
          </Button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="card p-5 text-center">
            <div className="font-display text-4xl font-semibold text-ink mb-1">
              {events.length}
            </div>
            <p className="text-pebble text-xs uppercase tracking-wide font-medium">
              {et("myEvents")}
            </p>
          </div>

          <div className="card p-5 text-center">
            <div className="font-display text-4xl font-semibold text-brand mb-1">
              {publishedCount}
            </div>
            <p className="text-pebble text-xs uppercase tracking-wide font-medium">
              {locale === "he" ? "פורסמו" : "Published"}
            </p>
          </div>

          <div className="card p-5 text-center">
            <div className="font-display text-4xl font-semibold text-ink-mid mb-1">
              {draftCount}
            </div>
            <p className="text-pebble text-xs uppercase tracking-wide font-medium">
              {locale === "he" ? "טיוטות" : "Drafts"}
            </p>
          </div>

          <div className="card p-5 text-center">
            <div className="font-display text-4xl font-semibold text-gold mb-1">0</div>
            <p className="text-pebble text-xs uppercase tracking-wide font-medium">
              {t("gifts")}
            </p>
          </div>
        </div>

        {/* ── Events Section ── */}
        <Card>
          <CardHeader className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="font-display">{et("myEvents")}</CardTitle>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/dashboard/events/new")}
            >
              {et("createEvent")}
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {events.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-brand-xlight flex items-center justify-center mx-auto mb-5">
                  <span className="text-2xl">🎉</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-ink mb-2">
                  {locale === "he" ? "ברוכים הבאים!" : "Welcome!"}
                </h3>
                <p className="text-pebble text-sm mb-6 max-w-xs mx-auto">
                  {locale === "he"
                    ? "צור את האירוע הראשון שלך כדי להתחיל לבנות את רשימת המתנות"
                    : "Create your first event to start building your gift registry"}
                </p>
                <Button onClick={() => router.push("/dashboard/events/new")}>
                  {et("createEvent")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {events.slice(0, 4).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {events.length > 4 && (
          <div className="mt-5 text-center">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/events")}
            >
              {locale === "he"
                ? `צפה בכל ${events.length} האירועים`
                : `View all ${events.length} events`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
