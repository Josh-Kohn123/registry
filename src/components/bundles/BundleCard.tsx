"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bundle } from "@/types/bundle";
import { BundleContributeForm } from "./BundleContributeForm";
import { trackOutboundClick } from "@/lib/tracking";

interface BundleCardProps {
  bundle: Bundle;
  currentContributions?: number;
  eventId?: string;
}

export function BundleCard({ bundle, currentContributions = 0, eventId }: BundleCardProps) {
  const t = useTranslations();
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleContributeClick = async () => {
    if (eventId) {
      await trackOutboundClick(eventId, "bundle", bundle.id);
    }
    setShowContributeForm(true);
  };

  const progressPercentage = Math.min(
    (currentContributions / bundle.targetAmount) * 100,
    100
  );

  const targetReached = currentContributions >= bundle.targetAmount;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      {bundle.imageUrl && (
        <div className="w-full h-48 bg-gray-200 overflow-hidden">
          <img
            src={bundle.imageUrl}
            alt={bundle.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        {/* Title and Description */}
        <h3 className="text-lg font-semibold mb-2">{bundle.title}</h3>
        {bundle.description && (
          <p className="text-gray-600 text-sm mb-3">{bundle.description}</p>
        )}

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              {t("gifts.targetProgress", {
                current: currentContributions.toLocaleString("he-IL"),
                target: bundle.targetAmount.toLocaleString("he-IL"),
              })}
            </span>
            {targetReached && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                {t("gifts.targetReached")}
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        {bundle.items && bundle.items.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium mb-2">{t("gifts.bundleItems")}:</p>
            <ul className="space-y-2">
              {bundle.items.map((item) => (
                <li key={item.id} className="text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-8 h-8 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500">{item.description}</p>
                      )}
                      {item.estimatedPrice && (
                        <p className="text-xs text-gray-600">
                          ₪{item.estimatedPrice.toLocaleString("he-IL")}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Store Domain */}
        <div className="text-xs text-gray-500 mb-4">
          {t("gifts.retailer")}: {bundle.storeDomain}
        </div>

        {/* Action Button */}
        {!showContributeForm ? (
          <button
            onClick={handleContributeClick}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {t("gifts.contributeToBundle")}
          </button>
        ) : (
          <div className="mt-4">
            <BundleContributeForm
              bundleId={bundle.id}
              onClose={() => {
                setShowContributeForm(false);
                setRefreshTrigger(prev => prev + 1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
