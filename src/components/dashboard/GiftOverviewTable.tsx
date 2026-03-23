"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface GiftItem {
  id: string;
  type: "product" | "fund" | "bundle";
  title: string;
  status: string;
  guestName?: string;
  amount?: number;
  createdAt: Date;
}

interface GiftOverviewTableProps {
  gifts: GiftItem[];
}

export function GiftOverviewTable({ gifts }: GiftOverviewTableProps) {
  const t = useTranslations();
  const [filterType, setFilterType] = useState<"all" | "product" | "fund" | "bundle">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = gifts.filter((gift) => {
    if (filterType !== "all" && gift.type !== filterType) return false;
    if (filterStatus !== "all" && gift.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-4">{t("dashboardMetrics.eventSummary")}</h2>

        <div className="flex gap-4 mb-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="product">Products</option>
            <option value="fund">Funds</option>
            <option value="bundle">Bundles</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="purchased">Purchased</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Type</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Title</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Guest</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Amount</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No gifts found
                </td>
              </tr>
            ) : (
              filtered.map((gift) => (
                <tr key={gift.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      {gift.type === "product" ? t("gifts.products") : gift.type === "fund" ? t("gifts.funds") : t("gifts.bundles")}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{gift.title}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs">
                      {gift.status === "available"
                        ? "Available"
                        : gift.status === "reserved"
                        ? "Reserved"
                        : "Purchased"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{gift.guestName || "-"}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {gift.amount ? `₪${gift.amount}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">
                    {new Date(gift.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
