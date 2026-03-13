"use client";

import { useState } from "react";
import { Fund } from "@/types/fund";
import { AmountChips } from "./AmountChips";
import { formatCurrency } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

interface FundCardProps {
  fund: Fund;
  declaredTotal: number;
  onContribute?: (amount: number, guestName?: string) => Promise<void>;
  eventId?: string;
}

export function FundCard({
  fund,
  declaredTotal,
  onContribute,
  eventId,
}: FundCardProps) {
  const t = useTranslations("gifts");
  const locale = useLocale();
  const [selectedAmount, setSelectedAmount] = useState<number | undefined>();
  const [guestName, setGuestName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const isMobile = typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

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

  const handleWalletClick = () => {
    // Non-blocking fire-and-forget tracking (F10)
    if (eventId) {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId: fund.id, eventType: "fund_click" }),
        keepalive: true,
      }).catch(() => {});
    }

    // F04: Bit on desktop shows QR modal, otherwise open link directly
    if (fund.walletProvider === "BIT" && !isMobile) {
      setShowQRModal(true);
    } else {
      window.open(fund.walletLink, "_blank", "noopener,noreferrer");
    }
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

      {/* Progress Bar (only if target is set, per F04) */}
      {fund.targetAmount && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600" dir="ltr">
              {formatCurrency(declaredTotal)} / {formatCurrency(fund.targetAmount)}
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

      {/* Amount Chips (F04: 360/500/720/1000 default) */}
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

      {/* "I sent it" Contribution Form */}
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
          className="flex-1 px-4 py-3 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
        >
          {locale === "he" ? "שלחתי ✓" : "I sent it ✓"}
        </button>
      </div>

      {/* Message about direct payment */}
      <p className="text-xs text-gray-500 text-center mt-3">
        {t("sendingDirectly")}
      </p>

      {/* QR Modal for Bit on Desktop (F04) */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQRModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              {locale === "he" ? "שלח דרך Bit" : "Send via Bit"}
            </h3>
            <div className="flex justify-center mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fund.walletLink)}`}
                alt="QR Code"
                width={200}
                height={200}
              />
            </div>
            <p className="text-sm text-gray-600 text-center mb-4">
              {locale === "he"
                ? "סרוק עם מצלמת הטלפון כדי לפתוח את Bit ולהשלים את ההעברה"
                : "Scan with your phone camera to open Bit and complete the transfer"}
            </p>
            <button
              onClick={() => setShowQRModal(false)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300"
            >
              {locale === "he" ? "סגור" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
