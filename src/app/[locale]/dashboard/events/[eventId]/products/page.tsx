import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEventById } from "@/lib/db";
import { AddProductForm } from "@/components/products/AddProductForm";
import { ProductListManager } from "@/components/products/ProductListManager";
import { getMessages } from "next-intl/server";

export default async function ProductsPage({
  params,
}: {
  params: { locale: string; eventId: string };
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect(`/${params.locale}/login`);
  }

  const event = await getEventById(params.eventId);

  if (!event) {
    redirect(`/${params.locale}/dashboard/events`);
  }

  // Check if user is owner
  const isOwner = event.owners.some((owner) => owner.profileId === session.user.id);
  if (!isOwner) {
    redirect(`/${params.locale}/dashboard/events`);
  }

  const messages = await getMessages();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <a
            href={`/${params.locale}/dashboard/events/${params.eventId}`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
          >
            ← {messages.common.back}
          </a>
          <h1 className="text-3xl font-bold text-gray-900">
            {messages.gifts.products}
          </h1>
          <p className="text-gray-600 mt-2">
            Paste product links from approved Israeli retailers. Guests can view and purchase from the retailer site.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Product Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Add New Product
            </h2>
            <AddProductForm
              eventId={params.eventId}
              locale={params.locale}
            />
          </div>

          {/* Products List */}
          <div className="bg-white rounded-lg shadow p-6">
            <ProductListManager
              eventId={params.eventId}
              locale={params.locale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
