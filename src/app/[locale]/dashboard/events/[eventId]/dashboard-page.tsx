"use client";

import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { EventWithOwners } from "@/types/event";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { GiftOverviewTable } from "@/components/dashboard/GiftOverviewTable";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { AnalyticsPanel } from "@/components/dashboard/AnalyticsPanel";
import { WhitelistRequestForm } from "@/components/dashboard/WhitelistRequestForm";

interface DashboardEventPageProps {
  params: {
    eventId: string;
  };
}

export default function DashboardEventPage({ params }: DashboardEventPageProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [event, setEvent] = useState<EventWithOwners | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalFundsRaised: 0,
    totalReservations: 0,
    totalConfirmedPurchases: 0,
    totalItems: 0,
  });

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventResponse = await fetch(`/api/events/${params.eventId}`);
        if (eventResponse.ok) {
          const eventData = await eventResponse.json();
          setEvent(eventData);

          // In a real app, fetch actual metrics from API
          // For now, mock data
          setMetrics({
            totalFundsRaised: 5000,
            totalReservations: 12,
            totalConfirmedPurchases: 8,
            totalItems: 25,
          });
        }
      } catch (error) {
        console.error("Failed to fetch event:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [params.eventId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>{t("common.loading")}</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>{t("events.eventNotFound")}</div>
      </div>
    );
  }

  const isRtl = locale === "he";

  return (
    <div className={`min-h-screen bg-gray-50 py-12 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← {t("common.back")}
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{event.title}</h1>
          <p className="text-gray-600">/{event.slug}</p>
        </div>

        {/* Metrics Cards */}
        <MetricsCards {...metrics} />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {t("dashboardMetrics.eventSummary")}
            </h3>
            <div className="space-y-3">
              <a
                href={`/dashboard/events/${params.eventId}/funds`}
                className="block px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
              >
                {t("gifts.manageFunds")}
              </a>
              <a
                href={`/dashboard/events/${params.eventId}/products`}
                className="block px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
              >
                {t("gifts.manageProducts")}
              </a>
              <a
                href={`/dashboard/events/${params.eventId}/bundles`}
                className="block px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
              >
                {t("gifts.manageBundles")}
              </a>
              <a
                href={`/dashboard/events/${params.eventId}/reservations`}
                className="block px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
              >
                {t("reservations.allReservations")}
              </a>
            </div>
          </div>

          <WhitelistRequestForm />
        </div>

        {/* Export */}
        <div className="mb-8">
          <ExportButton eventId={params.eventId} eventSlug={event.slug} />
        </div>

        {/* Analytics Panel */}
        <div className="mb-8">
          <AnalyticsPanel eventId={params.eventId} />
        </div>

        {/* Gifts Overview Table */}
        <GiftOverviewTable
          gifts={[
            // Mock data - in real app, fetch from API
            {
              id: "1",
              type: "product",
              title: "Example Product",
              status: "available",
              createdAt: new Date(),
            },
          ]}
        />
      </div>
    </div>
  );
}
