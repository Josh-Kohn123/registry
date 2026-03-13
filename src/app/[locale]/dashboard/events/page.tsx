"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { EventCard } from "@/components/events/EventCard";
import { EventWithOwners } from "@/types/event";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export default function EventsListPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("events");
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventWithOwners[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isRtl = locale === "he";

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
        <div className="text-lg text-gray-600">
          {locale === "he" ? "טוען..." : "Loading..."}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 py-12 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              {t("myEvents")}
            </h1>
            <p className="text-gray-600 mt-2">
              {locale === "he"
                ? `סה"כ ${events.length} אירועים`
                : `Total ${events.length} events`}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push("/dashboard/events/new")}
          >
            {t("createEvent")}
          </Button>
        </div>

        {events.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-600 mb-4">
              {locale === "he"
                ? "עדיין אין אירועים. צור את האירוע הראשון שלך!"
                : "No events yet. Create your first event!"}
            </p>
            <Button onClick={() => router.push("/dashboard/events/new")}>
              {t("createEvent")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
