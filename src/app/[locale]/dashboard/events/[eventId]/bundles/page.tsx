"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { CreateBundleForm } from "@/components/bundles/CreateBundleForm";
import { BundleListManager } from "@/components/bundles/BundleListManager";

export default function BundlesDashboardPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const eventId = params.eventId as string;

  return (
    <div className="space-y-6">
      <div>
        <a
          href={`/${locale}/dashboard/events/${eventId}`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
        >
          ← {t("common.back")}
        </a>
        <h1 className="text-2xl font-bold mb-2">{t("gifts.manageBundles")}</h1>
        <p className="text-gray-600">
          {t("gifts.bundleItems")} - {t("gifts.bundleTitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">{t("gifts.createBundle")}</h2>
            <CreateBundleForm onSuccess={() => window.location.reload()} />
          </div>
        </div>

        {/* List Manager */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              {t("gifts.manageBundles")}
            </h2>
            <BundleListManager />
          </div>
        </div>
      </div>
    </div>
  );
}
