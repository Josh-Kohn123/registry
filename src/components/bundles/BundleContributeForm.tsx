"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BundleContributeInput } from "@/lib/validators";

interface BundleContributeFormProps {
  bundleId: string;
  onClose?: () => void;
}

export function BundleContributeForm({
  bundleId,
  onClose,
}: BundleContributeFormProps) {
  const t = useTranslations();
  const params = useParams();
  const eventId = params.eventId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<BundleContributeInput>({
    amount: 0,
    guestName: "",
    message: "",
  });

  const handleFieldChange = (
    field: keyof BundleContributeInput,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.amount || formData.amount <= 0) {
        setError(t("errors.invalidReservation"));
        return;
      }

      const response = await fetch(
        `/api/events/${eventId}/bundles/${bundleId}/contribute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to record contribution");
        return;
      }

      setSuccess(true);
      setFormData({
        amount: 0,
        guestName: "",
        message: "",
      });

      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <p className="text-green-800">{t("gifts.bundleContributionRecorded")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded">
      <div>
        <label className="block text-sm font-medium mb-1">
          {t("gifts.bundleContributionAmount")}
        </label>
        <input
          type="number"
          value={formData.amount || ""}
          onChange={(e) =>
            handleFieldChange("amount", Number(e.target.value))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("gifts.bundleContributionName")}
        </label>
        <input
          type="text"
          value={formData.guestName || ""}
          onChange={(e) => handleFieldChange("guestName", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("gifts.bundleContributionMessage")}
        </label>
        <textarea
          value={formData.message || ""}
          onChange={(e) => handleFieldChange("message", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
        <p>{t("gifts.sendingDirectly")}</p>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? t("common.loading") : t("gifts.confirmContribution")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}
