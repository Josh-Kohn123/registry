"use client";

import { useState, useEffect } from "react";

interface Retailer {
  id: string;
  domain: string;
  name: string;
  allowedPaths: string | null;
  isActive: boolean;
  createdAt: string;
}

export function RetailerWhitelist() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Retailer>>({});

  useEffect(() => {
    fetchRetailers();
  }, []);

  const fetchRetailers = async (query = "") => {
    try {
      const url = query ? `/api/admin/retailers?q=${encodeURIComponent(query)}` : "/api/admin/retailers";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRetailers(data.retailers || []);
      }
    } catch (error) {
      console.error("Error fetching retailers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchRetailers(search);
  };

  const handleToggleActive = async (retailer: Retailer) => {
    try {
      const response = await fetch(`/api/admin/retailers/${retailer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !retailer.isActive }),
      });
      if (response.ok) {
        setRetailers((prev) =>
          prev.map((r) => (r.id === retailer.id ? { ...r, isActive: !r.isActive } : r))
        );
      }
    } catch (error) {
      console.error("Error toggling retailer:", error);
    }
  };

  const startEdit = (retailer: Retailer) => {
    setEditingId(retailer.id);
    setEditValues({ name: retailer.name, allowedPaths: retailer.allowedPaths });
  };

  const saveEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/retailers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      if (response.ok) {
        const data = await response.json();
        setRetailers((prev) =>
          prev.map((r) => (r.id === id ? data.retailer : r))
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error saving edit:", error);
    }
  };

  if (loading) return <p className="text-gray-500">Loading whitelist...</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search by domain or name..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <button onClick={handleSearch} className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm hover:bg-gray-200">
          Search
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Domain</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Allowed Paths</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Active</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Added</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {retailers.map((retailer) => (
              <tr key={retailer.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs">{retailer.domain}</td>
                <td className="px-4 py-2">
                  {editingId === retailer.id ? (
                    <input
                      value={editValues.name || ""}
                      onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                      className="px-2 py-1 border border-blue-300 rounded text-sm w-full"
                    />
                  ) : (
                    retailer.name
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {editingId === retailer.id ? (
                    <input
                      value={editValues.allowedPaths || ""}
                      onChange={(e) => setEditValues((v) => ({ ...v, allowedPaths: e.target.value || null }))}
                      placeholder="e.g. /he-il/"
                      className="px-2 py-1 border border-blue-300 rounded text-sm w-full"
                    />
                  ) : (
                    retailer.allowedPaths || "—"
                  )}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleToggleActive(retailer)}
                    className={`px-2 py-1 text-xs rounded ${
                      retailer.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {retailer.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {new Date(retailer.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  {editingId === retailer.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => saveEdit(retailer.id)} className="text-xs text-blue-600 hover:underline">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:underline">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(retailer)} className="text-xs text-blue-600 hover:underline">
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {retailers.length === 0 && (
        <p className="text-center text-gray-500 py-4">No retailers found</p>
      )}
    </div>
  );
}
