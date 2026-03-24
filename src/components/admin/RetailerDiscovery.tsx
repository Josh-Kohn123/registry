"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface DiscoveredRetailer {
  id: string;
  domain: string;
  name: string;
  score: number;
  hasOgTitle: boolean;
  hasOgImage: boolean;
  hasOgPrice: boolean;
  deliversToIsrael: string;
  deliveryEvidence: string | null;
  sampleProductUrl: string | null;
  sampleProductTitle: string | null;
  sampleImageUrl: string | null;
}

interface DiscoveryBatch {
  id: string;
  startedAt: string;
  status: string;
  searchQueries: string[];
  discoveries: DiscoveredRetailer[];
}

type Decision = "approve" | "reject" | null;

const SCORE_COLORS: Record<number, string> = {
  3: "bg-green-100 text-green-800 border-green-300",
  2: "bg-yellow-100 text-yellow-800 border-yellow-300",
  1: "bg-orange-100 text-orange-800 border-orange-300",
  0: "bg-red-100 text-red-800 border-red-300",
};

export function RetailerDiscovery() {
  const [batches, setBatches] = useState<DiscoveryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [decisions, setDecisions] = useState<Map<string, Decision>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscoveries();
  }, []);

  const fetchDiscoveries = async () => {
    try {
      const response = await fetch("/api/admin/retailers/discovery");
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error("Error fetching discoveries:", error);
    } finally {
      setLoading(false);
    }
  };

  const setDecision = (id: string, action: Decision) => {
    setDecisions((prev) => {
      const next = new Map(prev);
      if (action === null) next.delete(id);
      else next.set(id, action);
      return next;
    });
  };

  const handleSubmit = async () => {
    const entries = Array.from(decisions.entries())
      .filter(([, action]) => action !== null)
      .map(([id, action]) => ({ id, action: action! }));

    if (entries.length === 0) return;

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch("/api/admin/retailers/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions: entries }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmitResult(`Approved: ${data.approved}, Rejected: ${data.rejected}`);
        setDecisions(new Map());
        fetchDiscoveries(); // refresh
      }
    } catch (error) {
      console.error("Error submitting decisions:", error);
      setSubmitResult("Error submitting decisions");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading discoveries...</p>;

  if (batches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No pending discoveries</p>
        <p className="text-sm mt-1">Run the discovery script: <code className="bg-gray-100 px-2 py-1 rounded">npm run discover</code></p>
      </div>
    );
  }

  const totalDecisions = Array.from(decisions.values()).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {submitResult && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          {submitResult}
        </div>
      )}

      {batches.map((batch) => (
        <div key={batch.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">
                  Batch: {new Date(batch.startedAt).toLocaleDateString()}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({batch.discoveries.length} retailers)
                </span>
              </div>
              {batch.status === "failed" && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                  Partial (script failed)
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {batch.discoveries.map((retailer) => {
              const decision = decisions.get(retailer.id) || null;

              return (
                <div key={retailer.id} className="px-4 py-3 flex items-start gap-4">
                  {/* Sample image */}
                  <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                    {retailer.sampleImageUrl ? (
                      <Image
                        src={retailer.sampleImageUrl}
                        alt={retailer.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{retailer.name}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${SCORE_COLORS[retailer.score]}`}>
                        {retailer.score}/3
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${retailer.deliversToIsrael === "yes" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {retailer.deliversToIsrael === "yes" ? "Ships to IL" : "Delivery unknown"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{retailer.domain}</p>
                    {retailer.sampleProductTitle && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        Sample: {retailer.sampleProductTitle}
                      </p>
                    )}
                    {retailer.deliveryEvidence && (
                      <p className="text-xs text-gray-400 mt-0.5" title={retailer.deliveryEvidence}>
                        Evidence: {retailer.deliveryEvidence}
                      </p>
                    )}
                    {retailer.sampleProductUrl && (
                      <a
                        href={retailer.sampleProductUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline mt-0.5 inline-block"
                      >
                        View sample product
                      </a>
                    )}
                  </div>

                  {/* Approve/Reject */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setDecision(retailer.id, decision === "approve" ? null : "approve")}
                      className={`px-3 py-1 text-sm rounded border transition ${
                        decision === "approve"
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-green-700 border-green-300 hover:bg-green-50"
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setDecision(retailer.id, decision === "reject" ? null : "reject")}
                      className={`px-3 py-1 text-sm rounded border transition ${
                        decision === "reject"
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-red-700 border-red-300 hover:bg-red-50"
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Submit bar */}
      {totalDecisions > 0 && (
        <div className="sticky bottom-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            {totalDecisions} decision{totalDecisions !== 1 ? "s" : ""} ready
          </span>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {submitting ? "Submitting..." : "Submit Decisions"}
          </button>
        </div>
      )}
    </div>
  );
}
