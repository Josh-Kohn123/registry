"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { EventForm } from "@/components/events/EventForm";
import { EventCreationInput } from "@/lib/validators";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { EventWithOwners } from "@/types/event";

export default function EditEventPage({
  params,
}: {
  params: { eventId: string };
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("events");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<EventWithOwners | null>(null);
  const isRtl = locale === "he";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        // Fetch event
        try {
          const response = await fetch(`/api/events/${params.eventId}`);
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
      setIsFetching(false);
    });
  }, [router, params.eventId]);

  const handleSubmit = async (data: EventCreationInput) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/events/${params.eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.[0]?.message || "Failed to update event");
      }

      const updatedEvent = await response.json();
      router.push(`/dashboard/events/${updatedEvent.id}`);
    } catch (error) {
      console.error("Event update error:", error);
      alert(
        error instanceof Error
          ? error.message
          : locale === "he"
          ? "שגיאה בעדכון האירוע"
          : "Error updating event"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
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

  return (
    <div className={`min-h-screen bg-gray-50 ${isRtl ? "rtl" : "ltr"}`}>
      <EventForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        initialData={{
          title: event.title,
          coupleFirstName: "",
          coupleSecondName: "",
          description: event.description,
          eventDate: event.eventDate
            ? new Date(event.eventDate).toISOString().split("T")[0]
            : undefined,
          eventType: event.eventType,
          coverImageUrl: event.coverImageUrl,
          slug: event.slug,
          locale: event.locale as "en" | "he",
          timezone: event.timezone,
          visibility: event.visibility as "private" | "unlisted" | "public",
        }}
      />
    </div>
  );
}
