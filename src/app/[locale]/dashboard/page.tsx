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
        // Fetch user's events
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">{t("welcome")}</div>
      </div>
    );
  }

  const isRtl = locale === "he";
  const publishedCount = events.filter((e) => e.isPublished).length;

  return (
    <div className={`min-h-screen bg-gray-50 py-12 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {t("welcome")}
            </h1>
            <p className="text-gray-600">
              {locale === "he"
                ? `זהו דשבורדך, ${user?.email}`
                : `This is your dashboard, ${user?.email}`}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {events.length}
                </div>
                <p className="text-gray-600 mt-2">{et("myEvents")}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {publishedCount}
                </div>
                <p className="text-gray-600 mt-2">
                  {locale === "he" ? "פורסמו" : "Published"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">0</div>
                <p className="text-gray-600 mt-2">{t("guests")}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">0</div>
                <p className="text-gray-600 mt-2">{t("gifts")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events Section */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{et("myEvents")}</CardTitle>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/dashboard/events/new")}
            >
              {et("createEvent")}
            </Button>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  {locale === "he"
                    ? "עדיין אין אירועים. צור את האירוע הראשון שלך!"
                    : "No events yet. Create your first event!"}
                </p>
                <Button onClick={() => router.push("/dashboard/events/new")}>
                  {et("createEvent")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.slice(0, 4).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {events.length > 4 && (
          <div className="mt-6 text-center">
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
