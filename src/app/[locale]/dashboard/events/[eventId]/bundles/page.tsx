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
  const isHe = locale === "he";

  return (
    <div className={`min-h-screen bg-cream py-10 ${isHe ? "rtl" : "ltr"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <a
          href={`/${locale}/dashboard/events/${eventId}`}
          className="text-pebble hover:text-ink text-sm flex items-center gap-1.5 mb-8 w-fit transition-colors"
        >
          <span aria-hidden>←</span>
          {t("common.back")}
        </a>

        {/* Header */}
        <div className="mb-8">
          <p className="eyebrow mb-2">{isHe ? "ניהול" : "Registry"}</p>
          <h1 className="font-display text-3xl font-semibold text-ink mb-2">
            {t("gifts.manageBundles")}
          </h1>
          <p className="text-pebble text-sm">
            {t("gifts.bundleItems")} — {t("gifts.bundleTitle")}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Create Form — sticky left */}
          <div className="w-full lg:w-[380px] lg:flex-shrink-0 lg:sticky lg:top-6">
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">
                {t("gifts.createBundle")}
              </h2>
              <CreateBundleForm onSuccess={() => window.location.reload()} />
            </div>
          </div>

          {/* List Manager — flex grows */}
          <div className="flex-1 min-w-0">
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">
                {t("gifts.manageBundles")}
              </h2>
              <BundleListManager />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
