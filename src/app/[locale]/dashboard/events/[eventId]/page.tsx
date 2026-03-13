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
  const isRtl = locale === "he";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        // Fetch event
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
      const response = await fetch(
        `/api/events/${eventId}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isPublished: !event.isPublished }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setEvent(updated);
      }
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      alert(
        locale === "he"
          ? "שגיאה בשינוי מצב הפרסום"
          : "Error toggling publish status"
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(
      locale === "he"
        ? "האם אתה בטוח שברצונך למחוק אירוע זה?"
        : "Are you sure you want to delete this event?"
    )) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/events");
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert(
        locale === "he"
          ? "שגיאה במחיקת האירוע"
          : "Error deleting event"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">
          {locale === "he" ? "טוען..." : "Loading..."}
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">
          {locale === "he" ? "אירוע לא נמצא" : "Event not found"}
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

  return (
    <div className={`min-h-screen bg-gray-50 py-12 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">{event.title}</h1>
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/events")}
          >
            {locale === "he" ? "חזור" : "Back"}
          </Button>
        </div>

        {/* Event Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{locale === "he" ? "פרטי האירוע" : "Event Details"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  {locale === "he" ? "סוג אירוע" : "Type"}
                </p>
                <p className="font-medium">{eventTypeLabel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {locale === "he" ? "נראות" : "Visibility"}
                </p>
                <p className="font-medium">{visibilityLabel}</p>
              </div>
              {event.eventDate && (
                <div>
                  <p className="text-sm text-gray-600">
                    {locale === "he" ? "תאריך" : "Date"}
                  </p>
                  <p className="font-medium">
                    {new Date(event.eventDate).toLocaleDateString(
                      locale === "he" ? "he-IL" : "en-US"
                    )}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">
                  {locale === "he" ? "שפה" : "Language"}
                </p>
                <p className="font-medium">{event.locale}</p>
              </div>
            </div>

            {event.description && (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {locale === "he" ? "תיאור" : "Description"}
                </p>
                <p className="text-gray-900">{event.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Publishing Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {locale === "he" ? "מצב פרסום" : "Publishing Status"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {event.isPublished
                    ? locale === "he"
                      ? "פורסם"
                      : "Published"
                    : locale === "he"
                    ? "טיוטה"
                    : "Draft"}
                </p>
                <p className="text-sm text-gray-600">
                  {event.isPublished
                    ? locale === "he"
                      ? "האירוע גלוי לאורחים"
                      : "Event is visible to guests"
                    : locale === "he"
                    ? "האירוע אינו גלוי לאורחים"
                    : "Event is not visible to guests"}
                </p>
              </div>
              <Button
                onClick={handlePublishToggle}
                isLoading={isPublishing}
                variant={event.isPublished ? "outline" : "primary"}
              >
                {event.isPublished
                  ? t("unpublish")
                  : t("publish")}
              </Button>
            </div>

            {event.isPublished && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  {locale === "he" ? "קישור לעמוד הציבורי:" : "Public page URL:"}
                </p>
                <input
                  type="text"
                  value={publicUrl}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-between">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/events/${event.id}/edit`)}
          >
            {t("editEvent")}
          </Button>
          <Button variant="outline" className="text-red-600" onClick={handleDelete}>
            {locale === "he" ? "מחק אירוע" : "Delete Event"}
          </Button>
        </div>
      </div>
    </div>
  );
}
