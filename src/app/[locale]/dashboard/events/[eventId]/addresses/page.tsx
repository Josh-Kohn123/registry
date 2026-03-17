"use client";

import { useState, useEffect, use } from "react";
import { useLocale } from "next-intl";
import { Address, AddressInput } from "@/types/address";
import AddressForm from "@/components/addresses/AddressForm";

interface AddressesPageProps {
  params: Promise<{
    locale: string;
    eventId: string;
  }>;
}

export default function AddressesPage({ params }: AddressesPageProps) {
  const { eventId } = use(params);
  const locale = useLocale();
  const isHe = locale === "he";
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/addresses`);
        if (response.ok) {
          const data = await response.json();
          setAddresses(data);
        }
      } catch {
        setError(isHe ? "שגיאה בטעינת כתובות" : "Failed to load addresses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddresses();
  }, [eventId, isHe]);

  const handleSaveAddress = async (data: AddressInput) => {
    // Block setting multiple defaults — warn the user
    if (data.isDefault) {
      const existingDefault = addresses.find((a) => a.isDefault && a.id !== editingId);
      if (existingDefault) {
        const confirmMsg = isHe
          ? `כבר יש כתובת ברירת מחדל ("${existingDefault.recipientName}"). האם להחליף אותה?`
          : `There is already a default address ("${existingDefault.recipientName}"). Replace it as default?`;
        if (!confirm(confirmMsg)) {
          return;
        }
      }
    }

    try {
      const url = editingId
        ? `/api/events/${eventId}/addresses/${editingId}`
        : `/api/events/${eventId}/addresses`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const saved = await response.json();
        if (data.isDefault) {
          // Update local state: unset default on all others
          setAddresses((prev) =>
            prev.map((a) => {
              if (a.id === (editingId || saved.id)) return saved;
              return { ...a, isDefault: false };
            }).concat(editingId ? [] : [saved])
          );
        } else if (editingId) {
          setAddresses(addresses.map((a) => (a.id === editingId ? saved : a)));
        } else {
          setAddresses([...addresses, saved]);
        }
        setShowForm(false);
        setEditingId(null);
      } else {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || (isHe ? "שגיאה בשמירת הכתובת" : "Failed to save address"));
      }
    } catch {
      setError(isHe ? "שגיאה בשמירת הכתובת" : "Failed to save address");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm(isHe ? "האם אתה בטוח שברצונך למחוק כתובת זו?" : "Are you sure you want to delete this address?")) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/addresses/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setAddresses(addresses.filter((a) => a.id !== id));
      }
    } catch {
      setError(isHe ? "שגיאה במחיקת הכתובת" : "Failed to delete address");
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingId(address.id);
    setShowForm(true);
  };

  const editingAddress = editingId
    ? (() => {
        const address = addresses.find((a) => a.id === editingId);
        if (!address) return undefined;
        const { id, profileId, createdAt, updatedAt, encryptedData, ...input } = address;
        return input as AddressInput;
      })()
    : undefined;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        {isHe ? "טוען..." : "Loading..."}
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto py-8 px-4 ${isHe ? "rtl" : "ltr"}`}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          {isHe ? "ניהול כתובות משלוח" : "Manage Delivery Addresses"}
        </h1>
        <a
          href={`/${locale}/dashboard/events/${eventId}`}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {isHe ? "חזור" : "Back"}
        </a>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      <p className="mb-4 text-sm text-gray-500">
        {isHe
          ? "ניתן להוסיף מספר כתובות משלוח. כתובת ברירת מחדל אחת בלבד."
          : "You can add multiple delivery addresses. Only one can be the default."}
      </p>

      {showForm ? (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">
            {editingId
              ? (isHe ? "ערוך כתובת" : "Edit Address")
              : (isHe ? "הוסף כתובת חדשה" : "Add New Address")}
          </h2>
          <AddressForm
            eventId={eventId}
            initialData={editingAddress}
            onSave={handleSaveAddress}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
            }}
          />
        </div>
      ) : (
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
          }}
          className="mb-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {isHe ? "הוסף כתובת חדשה" : "Add New Address"}
        </button>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {isHe ? "אין כתובות עדיין. הוסף אחת כדי להתחיל." : "No addresses yet. Add one to get started."}
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="bg-white rounded-lg shadow p-6 flex justify-between items-start"
            >
              <div>
                <h3 className="font-semibold text-lg">{address.recipientName}</h3>
                <p className="text-gray-600">
                  {address.line1}
                  {address.line2 && `, ${address.line2}`}
                </p>
                <p className="text-gray-600">
                  <span dir="ltr">{address.postalCode}</span> {address.city}
                </p>
                {address.phone && (
                  <p className="text-gray-600">
                    {isHe ? "טלפון:" : "Phone:"}{" "}
                    <span dir="ltr">{address.phone}</span>
                  </p>
                )}
                {address.isDefault && (
                  <p className="text-blue-600 text-sm font-medium mt-2">
                    {isHe ? "כתובת ברירת מחדל" : "Default Address"}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditAddress(address)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {isHe ? "עריכה" : "Edit"}
                </button>
                <button
                  onClick={() => handleDeleteAddress(address.id)}
                  className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                >
                  {isHe ? "מחק" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
