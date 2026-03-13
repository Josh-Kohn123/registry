"use client";

import { Fund } from "@/types/fund";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface FundListManagerProps {
  funds: Fund[];
  declaredTotals: Record<string, number>;
  onEdit: (fund: Fund) => void;
  onDelete: (fundId: string) => Promise<void>;
  isLoading?: boolean;
}

export function FundListManager({
  funds,
  declaredTotals,
  onEdit,
  onDelete,
  isLoading = false,
}: FundListManagerProps) {
  const t = useTranslations("gifts");

  if (funds.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">{t("addFund")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {funds.map((fund) => {
        const declared = declaredTotals[fund.id] || 0;
        const progress = fund.targetAmount
          ? Math.min((declared / fund.targetAmount) * 100, 100)
          : 0;

        return (
          <div
            key={fund.id}
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{fund.title}</h4>
                {fund.description && (
                  <p className="text-sm text-gray-600">{fund.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(fund)}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  {t("edit")}
                </button>
                <button
                  onClick={() => onDelete(fund.id)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                >
                  {t("delete")}
                </button>
              </div>
            </div>

            {/* Provider and Link */}
            <div className="mb-2">
              <p className="text-xs text-gray-500">
                {fund.walletProvider} • {fund.walletLink}
              </p>
            </div>

            {/* Progress */}
            {fund.targetAmount && (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{t("totalDeclared")}</span>
                  <span>
                    {formatCurrency(declared)} / {formatCurrency(fund.targetAmount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="text-xs text-gray-500">
              {fund.suggestedAmounts.length} suggested amounts • {fund.clickCount}{" "}
              clicks
            </div>
          </div>
        );
      })}
    </div>
  );
}
