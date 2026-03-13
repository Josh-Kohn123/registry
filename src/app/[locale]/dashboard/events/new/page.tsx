"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { EventForm } from "@/components/events/EventForm";
import { EventCreationInput } from "@/lib/validators";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export default function NewEventPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("events");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const isRtl = locale === "he";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        router.push("/login");
      }
      setIsCheckingAuth(false);
    });
  }, [router]);

  const handleSubmit = async (data: EventCreationInput) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.[0]?.message || "Failed to create event");
      }

      const event = await response.json();
      router.push(`/dashboard/events/${event.id}`);
    } catch (error) {
      console.error("Event creation error:", error);
      alert(
        error instanceof Error
          ? error.message
          : locale === "he"
          ? "שגיאה ביצירת האירוע"
          : "Error creating event"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">
          {locale === "he" ? "טוען..." : "Loading..."}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRtl ? "rtl" : "ltr"}`}>
      <EventForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
