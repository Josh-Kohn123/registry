"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ReportButtonProps {
  eventId?: string;
  variant?: "icon" | "button";
}

export function ReportButton({ eventId, variant = "button" }: ReportButtonProps) {
  const t = useTranslations();
  const [showForm, setShowForm] = useState(false);
  const [reportType, setReportType] = useState("malicious_link");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedEventId: eventId,
          reportType,
          description,
          reporterEmail: email || undefined,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setDescription("");
        setEmail("");
        alert("Report submitted successfully");
      }
    } catch (error) {
      console.error("Report error:", error);
      alert("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={() => setShowForm(!showForm)}
        className="text-gray-500 hover:text-red-600 transition text-xl"
        title="Report this event"
      >
        ⚠️
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowForm(!showForm)}
        className="text-sm text-red-600 hover:text-red-800 underline"
      >
        {t("admin.reportButton")}
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="font-semibold text-gray-900 mb-4">Report this event</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="malicious_link">Malicious/Phishing Link</option>
                  <option value="spam">Spam</option>
                  <option value="abuse">Abuse</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Please describe the issue..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="your@email.com"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !description}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:bg-gray-300"
                >
                  {loading ? "Submitting..." : "Submit Report"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-md text-sm font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
