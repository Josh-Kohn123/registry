"use client";

import { useTranslations } from "next-intl";

interface ExportButtonProps {
  eventId: string;
  eventSlug: string;
}

export function ExportButton({ eventId, eventSlug }: ExportButtonProps) {
  const t = useTranslations();

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/export`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${eventSlug}-gifts-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert(t("common.error"));
    }
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
    >
      {t("dashboardMetrics.exportCSV")}
    </button>
  );
}
