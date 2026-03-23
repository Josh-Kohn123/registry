# F06 & F07 Usage Examples

## F06: Reservation & Confirm Flows

### Guest Reserve Flow

```typescript
// On product page, import the ReserveButton component
import ReserveButton from "@/components/reservations/ReserveButton";

export default function ProductCard({ product, eventId }) {
  return (
    <div>
      <h2>{product.title}</h2>
      <p>${product.estimatedPrice}</p>

      {/* Reserve button opens modal, creates reservation, opens retailer */}
      <ReserveButton
        eventId={eventId}
        productLinkId={product.id}
        retailerUrl={product.url}
      />
    </div>
  );
}
```

### Reservation Status Display

```typescript
import ReservationStatus from "@/components/reservations/ReservationStatus";

export default function ProductCard({ reservation }) {
  return (
    <div>
      {/* Shows "Available", "Reserved by X", "Purchased", etc. */}
      <ReservationStatus reservation={reservation} />
    </div>
  );
}
```

### Host Dashboard View

```typescript
import ReservationList from "@/components/reservations/ReservationList";

export default function ReservationsDashboard({ eventId }) {
  return (
    <div>
      <h1>All Reservations</h1>
      {/* Shows all reservations with filtering and actions */}
      <ReservationList eventId={eventId} />
    </div>
  );
}
```

### Direct API Usage

```typescript
// Create reservation
const response = await fetch(`/api/events/${eventId}/reservations`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    guestName: "Sarah Cohen",
    guestEmail: "sarah@example.com",
    productLinkId: "prod_123"
  })
});

const reservation = await response.json();
console.log(reservation.id); // res_abc123
console.log(reservation.expiresAt); // Expires in 48 hours

// Confirm purchase
const confirmResponse = await fetch(
  `/api/events/${eventId}/reservations/${reservation.id}/confirm`,
  { method: "POST" }
);

// Mark as received (host only)
const markResponse = await fetch(
  `/api/events/${eventId}/reservations/${reservation.id}`,
  {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "RECEIVED_HOST_CONFIRMED" })
  }
);

// Cancel reservation
const cancelResponse = await fetch(
  `/api/events/${eventId}/reservations/${reservation.id}`,
  { method: "DELETE" }
);
```

---

## F07: Address Privacy & Reveal

### Couple Dashboard - Add Address

```typescript
import AddressForm from "@/components/addresses/AddressForm";
import { AddressInput } from "@/types/address";

export default function AddressManagement({ eventId }) {
  const handleSaveAddress = async (data: AddressInput) => {
    const response = await fetch(`/api/events/${eventId}/addresses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const address = await response.json();
    alert("Address saved!");
  };

  return (
    <div>
      <h1>Manage Delivery Addresses</h1>
      <AddressForm
        eventId={eventId}
        onSave={handleSaveAddress}
        onCancel={() => {}}
      />
    </div>
  );
}
```

### Guest - Reveal Address (Gated)

```typescript
import AddressRevealButton from "@/components/addresses/AddressRevealButton";

export default function GiftPage({ eventId, reservation }) {
  // Only show if guest has active reservation
  if (!reservation ||
      (reservation.status !== "RESERVED" &&
       reservation.status !== "PURCHASED_GUEST_CONFIRMED")) {
    return <p>You must reserve this gift to see the address</p>;
  }

  return (
    <div>
      <h1>Ready to Ship?</h1>
      <p>Click below to reveal the shipping address</p>

      {/* Button opens address, shows copy-to-clipboard */}
      <AddressRevealButton
        eventId={eventId}
        reservationId={reservation.id}
      />
    </div>
  );
}
```

### Direct API Usage

```typescript
// Create address (owner only)
const response = await fetch(`/api/events/${eventId}/addresses`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    recipientName: "Sarah & David",
    phone: "05012345678",
    city: "Tel Aviv",
    line1: "Rothschild Boulevard 72",
    line2: "Apartment 5",
    postalCode: "6688103",
    notes: "Door code: 1234, Delivery between 9-17",
    isDefault: true
  })
});

const address = await response.json();

// Reveal address (requires active reservation)
const revealResponse = await fetch(
  `/api/events/${eventId}/addresses/reveal`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reservationId: "res_abc123" })
  }
);

const shippingInfo = await revealResponse.json();
// {
//   id: "addr_xyz789",
//   recipientName: "Sarah & David",
//   phone: "05012345678",
//   city: "Tel Aviv",
//   line1: "Rothschild Boulevard 72",
//   line2: "Apartment 5",
//   postalCode: "6688103",
//   notes: "Door code: 1234, Delivery between 9-17"
// }

// Update address
const updateResponse = await fetch(
  `/api/events/${eventId}/addresses/${address.id}`,
  {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isDefault: false })
  }
);

// Delete address
const deleteResponse = await fetch(
  `/api/events/${eventId}/addresses/${address.id}`,
  { method: "DELETE" }
);
```

---

## State Management Example

```typescript
import { useState, useEffect } from "react";
import { Reservation } from "@/types/reservation";

export default function EventDashboard({ eventId }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations();
  }, [eventId]);

  const fetchReservations = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/reservations`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setReservations(data);
    } catch (err) {
      setError("Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReceived = async (reservationId: string) => {
    try {
      const res = await fetch(
        `/api/events/${eventId}/reservations/${reservationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "RECEIVED_HOST_CONFIRMED"
          })
        }
      );

      const updated = await res.json();
      setReservations(
        reservations.map(r => r.id === reservationId ? updated : r)
      );
    } catch (err) {
      alert("Failed to update");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1>Reservations: {reservations.length}</h1>

      {reservations.filter(r => r.status === "RESERVED").length > 0 && (
        <div className="text-blue-600">
          {reservations.filter(r => r.status === "RESERVED").length} pending
        </div>
      )}

      {reservations.map(res => (
        <div key={res.id} className="border p-4 mb-2">
          <p><strong>{res.guestName}</strong></p>
          <p className="text-gray-600">{res.status}</p>

          {res.status === "PURCHASED_GUEST_CONFIRMED" && (
            <button onClick={() => handleMarkReceived(res.id)}>
              Mark as Received
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Validation Examples

```typescript
import {
  reservationCreateSchema,
  addressCreateSchema
} from "@/lib/validators";

// Validate reservation input
const reservationData = {
  guestName: "Sarah",
  guestEmail: "sarah@example.com",
  productLinkId: "prod_123"
};

const result = reservationCreateSchema.safeParse(reservationData);
if (result.success) {
  console.log("Valid!", result.data);
} else {
  console.log("Errors:", result.error.flatten());
}

// Validate address input
const addressData = {
  recipientName: "David Cohen",
  city: "Tel Aviv",
  line1: "King George St 42",
  isDefault: true
};

const addressResult = addressCreateSchema.safeParse(addressData);
if (addressResult.success) {
  console.log("Valid address!", addressResult.data);
} else {
  console.log("Errors:", addressResult.error.flatten());
  // Missing required field: "postalCode" error
}
```

---

## Translation Usage

```typescript
import { useTranslations } from "next-intl";

export default function ReservationComponent() {
  const t = useTranslations();

  return (
    <div>
      <button>{t("reservations.reserve")}</button>
      {/* "Reserve & Go to Store" or "שמור ועבור לחנות" */}

      <p>{t("reservations.reserved", { name: "Sarah" })}</p>
      {/* "Reserved by Sarah" or "שמור על ידי Sarah" */}

      <span>{t("addresses.copyToClipboard")}</span>
      {/* "Copy Address" or "העתק כתובת" */}
    </div>
  );
}
```

---

## Error Handling

```typescript
async function reserveGift() {
  try {
    const response = await fetch(`/api/events/${eventId}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reservationData)
    });

    if (!response.ok) {
      const error = await response.json();

      if (response.status === 409) {
        // Duplicate active reservation
        alert("Someone already reserved this item");
      } else if (response.status === 400) {
        // Validation error
        console.log(error.details);
      } else if (response.status === 404) {
        // Event not found
        alert("Event not found");
      }

      return;
    }

    const reservation = await response.json();
    console.log("Reservation created:", reservation);
  } catch (error) {
    console.error("Network error:", error);
  }
}
```

---

## Testing Mock Data

```typescript
import {
  createEvent,
  createProduct,
  createReservation,
  createAddress
} from "@/lib/db/mock";

// Set up test data
const event = await createEvent({
  title: "Test Wedding",
  slug: "test-wedding",
  owners: [{ id: "o1", profileId: "u1", role: "owner" }],
  // ... other fields
});

const product = await createProduct(event.id, {
  url: "https://example.com/item",
  title: "Gift",
  retailerDomain: "example.com"
});

const reservation = await createReservation(event.id, {
  guestName: "Test Guest",
  guestEmail: "guest@example.com",
  status: "RESERVED",
  expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  productLinkId: product.id
});

const address = await createAddress("profile_123", {
  recipientName: "Test Person",
  city: "Tel Aviv",
  line1: "Main St 123",
  isDefault: true,
  encryptedData: true
});
```
