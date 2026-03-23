"use client";

import { useState } from "react";
import { PublicAddressReveal } from "@/types/address";

interface AddressDisplayProps {
  address: PublicAddressReveal;
}

export default function AddressDisplay({ address }: AddressDisplayProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const fullAddress = [
    address.line1,
    address.line2,
    address.postalCode,
    address.city,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold">Shipping Information</h3>

      <div>
        <p className="text-sm text-gray-600">Recipient</p>
        <p className="font-medium">{address.recipientName}</p>
        <button
          onClick={() => copyToClipboard(address.recipientName, "name")}
          className="text-sm text-blue-600 hover:underline mt-1"
        >
          {copied === "name" ? "Copied!" : "Copy"}
        </button>
      </div>

      {address.phone && (
        <div>
          <p className="text-sm text-gray-600">Phone</p>
          <p className="font-medium">{address.phone}</p>
          <button
            onClick={() => copyToClipboard(address.phone!, "phone")}
            className="text-sm text-blue-600 hover:underline mt-1"
          >
            {copied === "phone" ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      <div>
        <p className="text-sm text-gray-600">Address</p>
        <p className="font-medium">{fullAddress}</p>
        <button
          onClick={() => copyToClipboard(fullAddress, "address")}
          className="text-sm text-blue-600 hover:underline mt-1"
        >
          {copied === "address" ? "Copied!" : "Copy"}
        </button>
      </div>

      {address.notes && (
        <div>
          <p className="text-sm text-gray-600">Delivery Notes</p>
          <p className="font-medium text-sm">{address.notes}</p>
          <button
            onClick={() => copyToClipboard(address.notes!, "notes")}
            className="text-sm text-blue-600 hover:underline mt-1"
          >
            {copied === "notes" ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      <button
        onClick={() => {
          const fullInfo = [
            address.recipientName,
            address.phone,
            fullAddress,
            address.notes ? `Notes: ${address.notes}` : "",
          ]
            .filter(Boolean)
            .join("\n");
          copyToClipboard(fullInfo, "full");
        }}
        className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {copied === "full" ? "Copied!" : "Copy All Information"}
      </button>
    </div>
  );
}
