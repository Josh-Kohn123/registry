"use client";

import { useTranslations, useLocale } from "next-intl";
import { EventSearch } from "@/components/admin/EventSearch";
import { ReportList } from "@/components/admin/ReportList";
import { AuditLog } from "@/components/admin/AuditLog";

export default function AdminPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "he";

  return (
    <div className={`min-h-screen bg-gray-50 py-12 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t("admin.adminPanel")}
          </h1>
          <p className="text-gray-600">Manage events, reports, and moderation</p>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-8">
            <a
              href="#search"
              className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium"
            >
              {t("admin.searchEvents")}
            </a>
            <a
              href="#reports"
              className="py-4 px-2 border-b-2 border-transparent hover:border-gray-300 text-gray-600 font-medium"
            >
              {t("admin.manageReports")}
            </a>
            <a
              href="#audit"
              className="py-4 px-2 border-b-2 border-transparent hover:border-gray-300 text-gray-600 font-medium"
            >
              {t("admin.auditLog")}
            </a>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          <section id="search">
            <EventSearch />
          </section>

          <section id="reports">
            <ReportList />
          </section>

          <section id="audit">
            <AuditLog />
          </section>
        </div>
      </div>
    </div>
  );
}
