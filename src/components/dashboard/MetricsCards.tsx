"use client";

import { useTranslations } from "next-intl";

interface MetricsCardsProps {
  totalFundsRaised: number;
  totalReservations: number;
  totalConfirmedPurchases: number;
  totalItems: number;
}

export function MetricsCards({
  totalFundsRaised,
  totalReservations,
  totalConfirmedPurchases,
  totalItems,
}: MetricsCardsProps) {
  const t = useTranslations();

  const metrics = [
    {
      label: t("dashboardMetrics.totalFundsRaised"),
      value: `₪${totalFundsRaised.toLocaleString("he-IL")}`,
    },
    {
      label: t("dashboardMetrics.totalReservations"),
      value: totalReservations,
    },
    {
      label: t("dashboardMetrics.totalConfirmedPurchases"),
      value: totalConfirmedPurchases,
    },
    {
      label: t("dashboardMetrics.totalItems"),
      value: totalItems,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow p-6 border border-gray-200"
        >
          <p className="text-gray-600 text-sm mb-2">{metric.label}</p>
          <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}
