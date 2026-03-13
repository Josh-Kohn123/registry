"use client";

import { formatCurrency } from "@/lib/utils";

interface AmountChipsProps {
  amounts: number[];
  selectedAmount?: number;
  onAmountSelect: (amount: number) => void;
  disabled?: boolean;
}

export function AmountChips({
  amounts,
  selectedAmount,
  onAmountSelect,
  disabled = false,
}: AmountChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {amounts.map((amount) => (
        <button
          key={amount}
          onClick={() => onAmountSelect(amount)}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedAmount === amount
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-900 hover:bg-gray-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {formatCurrency(amount)}
        </button>
      ))}
    </div>
  );
}
