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
      <div className={`min-h-screen bg-cream flex items-center justify-center ${isHe ? "rtl" : "ltr"}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <p className="text-pebble text-sm">{isHe ? "טוען..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-cream py-10 ${isHe ? "rtl" : "ltr"}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <a
          href={`/${locale}/dashboard/events/${eventId}`}
          className="text-pebble hover:text-ink text-sm flex items-center gap-1.5 mb-8 w-fit transition-colors"
        >
          <span aria-hidden>←</span>
          {isHe ? "חזור" : "Back"}
        </a>

        <div className="mb-8">
          <p className="eyebrow mb-2">{isHe ? "ניהול" : "Registry"}</p>
          <h1 className="font-display text-3xl font-semibold text-ink mb-2">
            {isHe ? "ניהול כתובות משלוח" : "Manage Delivery Addresses"}
          </h1>
          <p className="text-pebble text-sm">
            {isHe
              ? "ניתן להוסיף מספר כתובות משלוח. כתובת ברירת מחדל אחת בלבד."
              : "You can add multiple delivery addresses. Only one can be the default."}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">
            {error}
          </div>
        )}

        {showForm ? (
          <div className="card p-6 mb-8">
            <h2 className="font-display text-xl font-semibold text-ink mb-5">
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
            onClick={() => { setShowForm(true); setEditingId(null); }}
            className="mb-8 px-6 py-3 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-dark transition-colors"
          >
            {isHe ? "+ הוסף כתובת חדשה" : "+ Add New Address"}
          </button>
        )}

        {addresses.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-pebble text-sm">
              {isHe ? "אין כתובות עדיין. הוסף אחת כדי להתחיל." : "No addresses yet. Add one to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="card p-5 flex justify-between items-start gap-4"
              >
                <div>
                  <h3 className="font-semibold text-ink">{address.recipientName}</h3>
                  <p className="text-pebble text-sm mt-0.5">
                    {address.line1}{address.line2 && `, ${address.line2}`}
                  </p>
                  <p className="text-pebble text-sm">
                    <span dir="ltr">{address.postalCode}</span> {address.city}
                  </p>
                  {address.phone && (
                    <p className="text-pebble text-sm">
                      <span dir="ltr">{address.phone}</span>
                    </p>
                  )}
                  {address.isDefault && (
                    <span className="inline-block mt-2 text-xs font-medium text-brand bg-brand-xlight px-2 py-0.5 rounded-full border border-brand-light">
                      {isHe ? "ברירת מחדל" : "Default"}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleEditAddress(address)}
                    className="px-3 py-1.5 text-xs font-medium border border-warm-border rounded-lg hover:bg-cream text-ink-mid transition-colors"
                  >
                    {isHe ? "עריכה" : "Edit"}
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    className="px-3 py-1.5 text-xs font-medium border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    {isHe ? "מחק" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
