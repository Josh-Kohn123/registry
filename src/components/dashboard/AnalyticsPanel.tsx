"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface ClickStat {
  targetId: string;
  targetType: "product" | "fund" | "bundle";
  title: string;
  clickCount: number;
}

interface AnalyticsPanelProps {
  eventId: string;
}

export function AnalyticsPanel({ eventId }: AnalyticsPanelProps) {
  const t = useTranslations();
  const [stats, setStats] = useState<{
    totalClicks: number;
    clicksByItem: ClickStat[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/clicks`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch click stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [eventId]);

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  if (!stats || stats.totalClicks === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">{t("analytics.clickStats")}</h3>
        <p className="text-gray-600">{t("analytics.noClickData")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-gray-900 mb-4">{t("analytics.clickStats")}</h3>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-600 mb-1">{t("analytics.totalClicks")}</p>
        <p className="text-3xl font-bold text-blue-600">{stats.totalClicks}</p>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">{t("analytics.clicksPerItem")}</h4>
        <div className="space-y-3">
          {stats.clicksByItem
            .sort((a, b) => b.clickCount - a.clickCount)
            .map((item) => (
              <div key={`${item.targetType}_${item.targetId}`} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.targetType}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (item.clickCount / Math.max(...stats.clicksByItem.map((i) => i.clickCount))) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                    {item.clickCount}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
