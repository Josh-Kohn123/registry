"use client";

import { useState } from "react";
import { PublicAddressReveal } from "@/types/address";
import AddressDisplay from "./AddressDisplay";

interface AddressRevealButtonProps {
  eventId: string;
  reservationId: string;
}

export default function AddressRevealButton({
  eventId,
  reservationId,
}: AddressRevealButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState<PublicAddressReveal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddress, setShowAddress] = useState(false);

  const handleReveal = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/events/${eventId}/addresses/reveal`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to reveal address");
        setIsLoading(false);
        return;
      }

      const data: PublicAddressReveal = await response.json();
      setAddress(data);
      setShowAddress(true);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (address && showAddress) {
    return (
      <div>
        <AddressDisplay address={address} />
        <button
          onClick={() => setShowAddress(false)}
          className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Hide Address
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleReveal}
        disabled={isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
      >
        {isLoading ? "Revealing..." : "Reveal Shipping Address"}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}
