"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Fund } from "@/types/fund";
import { CreateFundForm } from "@/components/funds/CreateFundForm";
import { FundListManager } from "@/components/funds/FundListManager";

export default function FundsDashboardPage() {
  const t = useTranslations("gifts");
  const params = useParams();
  const eventId = params.eventId as string;

  const [funds, setFunds] = useState<Fund[]>([]);
  const [declaredTotals, setDeclaredTotals] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingFund, setEditingFund] = useState<Fund | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch funds
  useEffect(() => {
    fetchFunds();
  }, [eventId]);

  const fetchFunds = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/funds`);
      if (!response.ok) throw new Error("Failed to fetch funds");

      const data = await response.json();
      setFunds(data);

      // Fetch declared totals for each fund
      const totals: Record<string, number> = {};
      for (const fund of data) {
        try {
          const contribResponse = await fetch(
            `/api/events/${eventId}/funds/${fund.id}/contributions`
          );
          if (contribResponse.ok) {
            const contributions = await contribResponse.json();
            totals[fund.id] = contributions.reduce(
              (sum: number, c: any) => sum + c.reportedAmount,
              0
            );
          }
        } catch (err) {
          // Endpoint may not exist yet, use 0
          totals[fund.id] = 0;
        }
      }
      setDeclaredTotals(totals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading funds");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFund = async (data: any) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create fund");

      const newFund = await response.json();
      setFunds([...funds, newFund]);
      setDeclaredTotals({ ...declaredTotals, [newFund.id]: 0 });
      setIsCreating(false);
      setEditingFund(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating fund");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateFund = async (data: any) => {
    if (!editingFund) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/events/${eventId}/funds/${editingFund.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) throw new Error("Failed to update fund");

      const updatedFund = await response.json();
      setFunds(funds.map((f) => (f.id === updatedFund.id ? updatedFund : f)));
      setEditingFund(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating fund");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFund = async (fundId: string) => {
    if (!window.confirm(t("deleteFund"))) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/funds/${fundId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete fund");

      setFunds(funds.filter((f) => f.id !== fundId));
      const newTotals = { ...declaredTotals };
      delete newTotals[fundId];
      setDeclaredTotals(newTotals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting fund");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("manageFunds")}
          </h1>
          <p className="text-gray-600">
            Create and manage cash gift funds for your event.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Create/Edit Form */}
        {isCreating || editingFund ? (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingFund ? t("editFund") : t("createNewFund")}
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingFund(null);
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            <CreateFundForm
              eventId={eventId}
              initialData={editingFund || undefined}
              onSubmit={editingFund ? handleUpdateFund : handleCreateFund}
              isLoading={isLoading}
            />
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="mb-8 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {t("addFund")}
          </button>
        )}

        {/* Funds List */}
        <FundListManager
          funds={funds}
          declaredTotals={declaredTotals}
          onEdit={(fund) => setEditingFund(fund)}
          onDelete={handleDeleteFund}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
