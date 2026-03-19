import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEventById } from "@/lib/db";
import { ProductsPageClient } from "@/components/products/ProductsPageClient";
import { getMessages } from "next-intl/server";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string; eventId: string }>;
}) {
  const { locale, eventId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const event = await getEventById(eventId);

  if (!event) {
    redirect(`/${locale}/dashboard/events`);
  }

  // Check if user is owner
  const isOwner = event.owners.some((owner) => owner.profileId === user.id);
  if (!isOwner) {
    redirect(`/${locale}/dashboard/events`);
  }

  const messages = await getMessages();

  const isHe = locale === "he";

  return (
    <div className={`min-h-screen bg-cream ${isHe ? "rtl" : "ltr"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back link */}
        <a
          href={`/${locale}/dashboard/events/${eventId}`}
          className="text-pebble hover:text-ink text-sm flex items-center gap-1.5 mb-8 w-fit transition-colors"
        >
          <span aria-hidden>←</span>
          {messages.common.back}
        </a>

        {/* Header */}
        <div className="mb-8">
          <p className="eyebrow mb-2">{isHe ? "ניהול" : "Registry"}</p>
          <h1 className="font-display text-3xl font-semibold text-ink mb-2">
            {isHe ? "בניית רשימת המתנות" : "Build Your Gift Registry"}
          </h1>
          <p className="text-pebble text-sm max-w-xl">
            {isHe
              ? "הוסיפו מוצרים שתרצו לקבל כמתנה. אורחים יראו את הרשימה ויוכלו לרכוש ישירות מהחנות."
              : "Add the products you'd love to receive. Guests will see your list and can purchase directly from the retailer."}
          </p>
        </div>

        {/* Recommended Products Banner */}
        <a
          href={`/${locale}/dashboard/events/${eventId}/recommendations`}
          className="group flex items-center justify-between gap-4 w-full mb-8 p-4 bg-ink text-warm-white rounded-2xl hover:bg-ink/90 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-brand/30 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-light" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">
                {isHe ? "✨ לא בטוחים מה להוסיף? התחילו מהמוצרים המומלצים שלנו" : "✨ Not sure where to start? Browse our curated picks"}
              </p>
              <p className="text-warm-white/60 text-xs mt-0.5">
                {isHe
                  ? "מוצרים נבחרים מ-IKEA, FOX HOME, Naaman, ACE ועוד — בלחיצה אחת"
                  : "Hand-picked items from IKEA, FOX HOME, Naaman, ACE & more — add in one click"}
              </p>
            </div>
          </div>
          <svg className="w-4 h-4 flex-shrink-0 opacity-60 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>

        <ProductsPageClient eventId={eventId} locale={locale} />
      </div>
    </div>
  );
}
