"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { AddressInput } from "@/types/address";

interface AddressFormProps {
  eventId: string;
  initialData?: AddressInput;
  onSave: (data: AddressInput) => Promise<void>;
  onCancel: () => void;
}

export default function AddressForm({
  eventId,
  initialData,
  onSave,
  onCancel,
}: AddressFormProps) {
  const locale = useLocale();
  const isHe = locale === "he";
  const [formData, setFormData] = useState<AddressInput>(
    initialData || {
      recipientName: "",
      phone: "",
      city: "",
      line1: "",
      line2: "",
      postalCode: "",
      notes: "",
      isDefault: false,
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onSave(formData);
    } catch {
      setError(isHe ? "שגיאה בשמירת הכתובת" : "Failed to save address");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${isHe ? "rtl" : "ltr"}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          {isHe ? "שם הנמען *" : "Recipient Name *"}
        </label>
        <input
          type="text"
          name="recipientName"
          value={formData.recipientName}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {isHe ? "טלפון" : "Phone"}
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone || ""}
          onChange={handleChange}
          dir="ltr"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {isHe ? "עיר *" : "City *"}
        </label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {isHe ? "כתובת רחוב *" : "Street Address *"}
        </label>
        <input
          type="text"
          name="line1"
          value={formData.line1}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {isHe ? "דירה/יחידה (אופציונלי)" : "Apartment/Unit (optional)"}
        </label>
        <input
          type="text"
          name="line2"
          value={formData.line2 || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {isHe ? "מיקוד" : "Postal Code"}
        </label>
        <input
          type="text"
          name="postalCode"
          value={formData.postalCode || ""}
          onChange={handleChange}
          dir="ltr"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {isHe ? "הערות משלוח (אופציונלי)" : "Delivery Notes (optional)"}
        </label>
        <textarea
          name="notes"
          value={formData.notes || ""}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isDefault"
          id="isDefault"
          checked={formData.isDefault || false}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isDefault" className="text-sm font-medium">
          {isHe ? "הגדר כברירת מחדל" : "Set as default address"}
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {isHe ? "ביטול" : "Cancel"}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading
            ? (isHe ? "שומר..." : "Saving...")
            : (isHe ? "שמור כתובת" : "Save Address")}
        </button>
      </div>
    </form>
  );
}
