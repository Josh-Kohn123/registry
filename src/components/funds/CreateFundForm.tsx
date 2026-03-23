"use client";

import { useState } from "react";
import { Fund, WalletProvider } from "@/types/fund";
import { useTranslations } from "next-intl";
import { WalletSetupGuide } from "./WalletSetupGuide";

interface CreateFundFormProps {
  eventId: string;
  initialData?: Fund;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

const DEFAULT_SUGGESTED_AMOUNTS = [360, 500, 720, 1000];

export function CreateFundForm({
  eventId,
  initialData,
  onSubmit,
  isLoading = false,
}: CreateFundFormProps) {
  const t = useTranslations("gifts");
  const tc = useTranslations("common");

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [walletProvider, setWalletProvider] = useState<WalletProvider>(
    initialData?.walletProvider || "PAYBOX"
  );
  const [walletLink, setWalletLink] = useState(initialData?.walletLink || "");
  const [targetAmount, setTargetAmount] = useState(
    initialData?.targetAmount?.toString() || ""
  );
  const [suggestedAmountsText, setSuggestedAmountsText] = useState(
    initialData?.suggestedAmounts.join(", ") ||
      DEFAULT_SUGGESTED_AMOUNTS.join(", ")
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse suggested amounts
    const suggestedAmounts = suggestedAmountsText
      .split(",")
      .map((a) => Number(a.trim()))
      .filter((a) => !isNaN(a) && a > 0);

    if (suggestedAmounts.length === 0) {
      alert("Please provide at least one valid suggested amount");
      return;
    }

    const data = {
      title,
      description,
      walletProvider,
      walletLink,
      targetAmount: targetAmount ? Number(targetAmount) : undefined,
      suggestedAmounts,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("fundTitle")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("fundTitle")}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("fundDescription")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("fundDescription")}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Wallet Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("walletProvider")}
          </label>
          <select
            value={walletProvider}
            onChange={(e) => setWalletProvider(e.target.value as WalletProvider)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="PAYBOX">{t("walletProviderPayBox")}</option>
            <option value="BIT">{t("walletProviderBit")}</option>
            <option value="OTHER">{t("walletProviderOther")}</option>
          </select>
        </div>

        {/* Wallet Setup Guide */}
        <WalletSetupGuide provider={walletProvider} />

        {/* Wallet Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("walletLink")}
          </label>
          <input
            type="url"
            value={walletLink}
            onChange={(e) => setWalletLink(e.target.value)}
            placeholder={
              walletProvider === "PAYBOX"
                ? "https://paybox.me/page/..."
                : walletProvider === "BIT"
                ? "https://bit.co.il/p/..."
                : "https://..."
            }
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Target Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("targetAmount")}
          </label>
          <input
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder={t("targetAmount")}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Suggested Amounts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("suggestedAmounts")}
          </label>
          <textarea
            value={suggestedAmountsText}
            onChange={(e) => setSuggestedAmountsText(e.target.value)}
            placeholder="360, 500, 720, 1000"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            {t("suggestedAmountsHint")}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? tc("loading") : initialData ? t("editFund") : t("addFund")}
        </button>
      </div>
    </form>
  );
}
