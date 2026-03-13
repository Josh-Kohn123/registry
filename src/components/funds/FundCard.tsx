"use client";

import { useState } from "react";
import { Fund } from "@/types/fund";
import { AmountChips } from "./AmountChips";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { trackOutboundClick } from "@/lib/tracking";

interface FundCardProps {
  fund: Fund;
  declaredTotal: number;
  onContribute?: (amount: number, guestName?: string) => Promise<void>;
  eventId?: string;
}

const WALLET_PROVIDER_LABELS: Record<string, string> = {
  PAYBOX: "Send via PayBox",
  BIT: "Send via Bit",
  OTHER: "Send Gift",
};

export function FundCard({
  fund,
  declaredTotal,
  onContribute,
  eventId,
}: FundCardProps) {
  const t = useTranslations("gifts");
  const [selectedAmount, setSelectedAmount] = useState<number | undefined>();
  const [guestName, setGuestName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showContributeForm, setShowContributeForm] = useState(false);

  const progressPercent = fund.targetAmount
    ? Math.min((declaredTotal / fund.targetAmount) * 100, 100)
    : 0;

  const handleContribute = async () => {
    if (!selectedAmount || !onContribute) return;

    setIsLoading(true);
    try {
      await onContribute(selectedAmount, guestName || undefined);
      setSelectedAmount(undefined);
      setGuestName("");
      setShowContributeForm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletClick = async () => {
    if (eventId) {
      await trackOutboundClick(eventId, "fund", fund.id, fund.walletLink);
    }
    window.open(fund.walletLink, "_blank");
  };

  const getProviderLabel = (): string => {
    switch (fund.walletProvider) {
      case "PAYBOX":
        return t("sendViaPayBox");
      case "BIT":
        return t("sendViaBit");
      default:
        return t("sendViaWallet");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{fund.title}</h3>
        {fund.description && (
          <p className="text-gray-600 text-sm">{fund.description}</p>
        )}
      </div>

      {/* Progress Bar */}
      {fund.targetAmount && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {t("totalDeclared")}: {formatCurrency(declaredTotal)}
            </span>
            <span className="text-sm text-gray-600">
              {formatCurrency(fund.targetAmount)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Amount Chips */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">
          {t("suggestedAmounts")}
        </p>
        <AmountChips
          amounts={fund.suggestedAmounts}
          selectedAmount={selectedAmount}
          onAmountSelect={setSelectedAmount}
        />
      </div>

      {/* Contribution Form */}
      {showContributeForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t("declaredAmount")}
            </label>
            <input
              type="number"
              placeholder={t("declaredAmountPlaceholder")}
              value={selectedAmount || ""}
              onChange={(e) => setSelectedAmount(Number(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              min="1"
            />
          </div>
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t("guestName")}
            </label>
            <input
              type="text"
              placeholder={t("guestName")}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleContribute}
              disabled={!selectedAmount || isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? t("loading") : t("confirmContribution")}
            </button>
            <button
              onClick={() => setShowContributeForm(false)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-300"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex gap-2">
        <button
          onClick={handleWalletClick}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {getProviderLabel()}
        </button>
        <button
          onClick={() => setShowContributeForm(!showContributeForm)}
          className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          {t("confirmContribution")}
        </button>
      </div>

      {/* Message about direct payment */}
      <p className="text-xs text-gray-500 text-center mt-3">
        {t("sendingDirectly")}
      </p>
    </div>
  );
}
