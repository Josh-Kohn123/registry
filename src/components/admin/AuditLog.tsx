"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminAction } from "@/types/admin";

interface AuditLogProps {
  eventId?: string;
}

export function AuditLog({ eventId }: AuditLogProps) {
  const t = useTranslations();
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLog = async () => {
      try {
        const url = eventId
          ? `/api/admin/audit?eventId=${eventId}`
          : "/api/admin/audit";

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setActions(data.actions || []);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLog();
  }, [eventId]);

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  if (actions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{t("admin.auditLog")}</h2>
        <p className="text-gray-600">No admin actions recorded</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{t("admin.auditLog")}</h2>

      <div className="space-y-4">
        {actions.map((action) => (
          <div key={action.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-900">
                  {action.actionType.replace(/_/g, " ").toUpperCase()}
                </p>
                {action.reason && (
                  <p className="text-sm text-gray-600 mt-1">{action.reason}</p>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {new Date(action.createdAt).toLocaleString()}
              </p>
            </div>
            {action.adminId && (
              <p className="text-xs text-gray-500 mt-2">By: {action.adminId}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
