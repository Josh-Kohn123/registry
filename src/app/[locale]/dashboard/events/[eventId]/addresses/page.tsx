"use client";

import { useState, useEffect } from "react";
import { Address, AddressInput } from "@/types/address";
import AddressForm from "@/components/addresses/AddressForm";

interface AddressesPageProps {
  params: {
    locale: string;
    eventId: string;
  };
}

export default function AddressesPage({
  params: { locale, eventId },
}: AddressesPageProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        // In a real app, fetch from API
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load addresses");
        setIsLoading(false);
      }
    };

    fetchAddresses();
  }, [eventId]);

  const handleSaveAddress = async (data: AddressInput) => {
    try {
      setShowForm(false);
      setEditingId(null);

      const newAddress: Address = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        profileId: "current-user",
        encryptedData: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingId) {
        setAddresses(
          addresses.map((a) => (a.id === editingId ? newAddress : a))
        );
      } else {
        setAddresses([...addresses, newAddress]);
      }
    } catch (err) {
      setError("Failed to save address");
      console.error(err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (err) {
      setError("Failed to delete address");
      console.error(err);
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
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Manage Delivery Addresses</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm ? (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">
            {editingId ? "Edit Address" : "Add New Address"}
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
          Add New Address
        </button>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No addresses yet. Add one to get started.
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
                  {address.postalCode} {address.city}
                </p>
                {address.phone && (
                  <p className="text-gray-600">Phone: {address.phone}</p>
                )}
                {address.isDefault && (
                  <p className="text-blue-600 text-sm font-medium mt-2">
                    Default Address
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditAddress(address)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAddress(address.id)}
                  className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
