"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { EventWithOwners } from "@/types/event";
import { Link } from "@/i18n/navigation";

export default function DashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const [events, setEvents] = useState<EventWithOwners[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isRtl = locale === "he";

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        router.push("/login");
        return;
      }
      try {
        const response = await fetch("/api/events");
        if (response.ok) {
          const eventsData: EventWithOwners[] = await response.json();
          setEvents(eventsData);
          // If they already have an event, go straight to it
          if (eventsData.length > 0) {
            router.replace(`/dashboard/events/${eventsData[0].id}`);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
      setIsLoading(false);
    });
  }, [router]);

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

  // No events yet — show the "create your registry" welcome screen
  return (
    <div className={`min-h-screen bg-cream flex flex-col items-center justify-center px-5 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-md w-full text-center">

        <p className="eyebrow mb-6">
          {isRtl ? "רשם המתנות שלכם" : "Your Gift Registry"}
        </p>

        <h1
          className="font-display font-normal text-ink leading-[1.05] tracking-tight mb-5"
          style={{ fontSize: "clamp(2.4rem, 5vw, 3.5rem)" }}
        >
          {isRtl ? (
            <>ברוכים הבאים!<br /><em className="text-brand">בואו נתחיל.</em></>
          ) : (
            <>Welcome!<br /><em className="text-brand">Let&apos;s build yours.</em></>
          )}
        </h1>

        <div className="w-8 h-px bg-warm-border mx-auto mb-6" />

        <p className="text-pebble font-light text-[17px] leading-relaxed mb-10">
          {isRtl
            ? "צרו את רשם המתנות שלכם — הוסיפו מוצרים מכל חנות ישראלית ושתפו עם האורחים בלחיצה אחת."
            : "Create your registry — add gifts from any Israeli retailer and share one link with your guests."}
        </p>

        <Link href="/dashboard/events/new">
          <button className="bg-ink text-cream text-[13px] font-medium tracking-[0.07em] uppercase px-10 py-4 hover:opacity-80 transition-opacity">
            {isRtl ? "יצירת רשם חינמי ←" : "Create your registry →"}
          </button>
        </Link>

        <p className="text-mist text-xs mt-5">
          {isRtl ? "ללא כרטיס אשראי · חינם לחלוטין" : "No credit card · Completely free"}
        </p>
      </div>
    </div>
  );
}
