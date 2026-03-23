"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Report } from "@/types/admin";

export function ReportList() {
  const t = useTranslations();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED" | "all">("PENDING");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/admin/reports");
        if (response.ok) {
          const data = await response.json();
          setReports(data.reports || []);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleResolve = async (reportId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          action,
        }),
      });

      if (response.ok) {
        setReports(reports.map((r) => (r.id === reportId ? { ...r, status: "RESOLVED" } : r)));
      }
    } catch (error) {
      console.error("Resolve error:", error);
    }
  };

  const filtered = reports.filter((r) => filter === "all" || r.status === filter);

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{t("admin.manageReports")}</h2>

      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Reports</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-600">{t("admin.manageReports")} - No reports</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => (
            <div key={report.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {report.reportType.replace(/_/g, " ").toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Event: {report.reportedEventId || "N/A"}
                  </p>
                  {report.reporterEmail && (
                    <p className="text-sm text-gray-600">From: {report.reporterEmail}</p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    report.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : report.status === "RESOLVED"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {report.status}
                </span>
              </div>

              {report.description && (
                <p className="text-sm text-gray-700 mb-3">{report.description}</p>
              )}

              <div className="text-xs text-gray-500 mb-3">
                {new Date(report.createdAt).toLocaleString()}
              </div>

              {report.status === "PENDING" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolve(report.id, "disable")}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Disable Event
                  </button>
                  <button
                    onClick={() => handleResolve(report.id, "dismiss")}
                    className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
