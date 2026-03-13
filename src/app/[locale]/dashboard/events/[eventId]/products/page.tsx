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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <a
            href={`/${locale}/dashboard/events/${eventId}`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
          >
            ← {messages.common.back}
          </a>
          <h1 className="text-3xl font-bold text-gray-900">
            {messages.gifts.products}
          </h1>
          <p className="text-gray-600 mt-2">
            {locale === "he"
              ? "הדבק קישורים למוצרים מחנויות מאושרות. אורחים יכולים לצפות ולרכוש מהאתר של החנות."
              : "Paste product links from approved Israeli retailers. Guests can view and purchase from the retailer site."}
          </p>
        </div>

        <ProductsPageClient eventId={eventId} locale={locale} />
      </div>
    </div>
  );
}
