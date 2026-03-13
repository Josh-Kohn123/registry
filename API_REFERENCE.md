# F06 & F07 API Reference

## Reservation Endpoints

### Create Reservation
**POST** `/api/events/[eventId]/reservations`

Request body:
```json
{
  "guestName": "David Cohen",
  "guestEmail": "david@example.com",
  "productLinkId": "prod_123",
  "bundleId": null
}
```

Response (201):
```json
{
  "id": "res_abc123",
  "eventId": "evt_456",
  "guestName": "David Cohen",
  "guestEmail": "david@example.com",
  "status": "RESERVED",
  "expiresAt": "2026-03-14T20:49:00Z",
  "confirmedAt": null,
  "receivedAt": null,
  "productLinkId": "prod_123",
  "bundleId": null,
  "createdAt": "2026-03-12T20:49:00Z",
  "updatedAt": "2026-03-12T20:49:00Z"
}
```

Error (409 - conflict):
```json
{
  "error": "This item already has an active reservation"
}
```

---

### List Reservations
**GET** `/api/events/[eventId]/reservations`

Response (200):
```json
[
  {
    "id": "res_abc123",
    "eventId": "evt_456",
    "guestName": "David Cohen",
    "guestEmail": "david@example.com",
    "status": "RESERVED",
    "expiresAt": "2026-03-14T20:49:00Z",
    "confirmedAt": null,
    "receivedAt": null,
    "productLinkId": "prod_123",
    "bundleId": null,
    "createdAt": "2026-03-12T20:49:00Z",
    "updatedAt": "2026-03-12T20:49:00Z"
  }
]
```

---

### Update Reservation
**PUT** `/api/events/[eventId]/reservations/[reservationId]`

Request body:
```json
{
  "status": "RECEIVED_HOST_CONFIRMED"
}
```

Response (200):
```json
{
  "id": "res_abc123",
  "eventId": "evt_456",
  "guestName": "David Cohen",
  "status": "RECEIVED_HOST_CONFIRMED",
  "receivedAt": "2026-03-13T10:30:00Z",
  ...
}
```

---

### Confirm Purchase
**POST** `/api/events/[eventId]/reservations/[reservationId]/confirm`

Request body:
```json
{
  "guestEmail": "david@example.com"
}
```

Response (200):
```json
{
  "id": "res_abc123",
  "status": "PURCHASED_GUEST_CONFIRMED",
  "confirmedAt": "2026-03-13T09:15:00Z",
  ...
}
```

---

### Delete/Cancel Reservation
**DELETE** `/api/events/[eventId]/reservations/[reservationId]`

Response (204): No content

---

## Address Endpoints

### Create Address
**POST** `/api/events/[eventId]/addresses`

Request body:
```json
{
  "recipientName": "Sarah & David",
  "phone": "05012345678",
  "city": "Tel Aviv",
  "line1": "Rothschild Boulevard 72",
  "line2": "Apartment 5",
  "postalCode": "6688103",
  "notes": "Door code: 1234",
  "isDefault": true
}
```

Response (201):
```json
{
  "id": "addr_xyz789",
  "profileId": "profile_user1",
  "recipientName": "Sarah & David",
  "phone": "05012345678",
  "city": "Tel Aviv",
  "line1": "Rothschild Boulevard 72",
  "line2": "Apartment 5",
  "postalCode": "6688103",
  "notes": "Door code: 1234",
  "isDefault": true,
  "encryptedData": true,
  "createdAt": "2026-03-12T20:49:00Z",
  "updatedAt": "2026-03-12T20:49:00Z"
}
```

---

### List Addresses (Owner Only)
**GET** `/api/events/[eventId]/addresses`

Response (200):
```json
[]
```

Note: Returns empty array if not authenticated as event owner.

---

### Update Address
**PUT** `/api/events/[eventId]/addresses/[addressId]`

Request body:
```json
{
  "phone": "05087654321",
  "isDefault": false
}
```

Response (200):
```json
{
  "id": "addr_xyz789",
  "phone": "05087654321",
  "isDefault": false,
  "updatedAt": "2026-03-13T10:30:00Z",
  ...
}
```

---

### Delete Address
**DELETE** `/api/events/[eventId]/addresses/[addressId]`

Response (204): No content

---

### Reveal Address (Gated)
**POST** `/api/events/[eventId]/addresses/reveal`

Request body:
```json
{
  "reservationId": "res_abc123"
}
```

Response (200):
```json
{
  "id": "addr_xyz789",
  "recipientName": "Sarah & David",
  "phone": "05012345678",
  "city": "Tel Aviv",
  "line1": "Rothschild Boulevard 72",
  "line2": "Apartment 5",
  "postalCode": "6688103",
  "notes": "Door code: 1234"
}
```

Error (403):
```json
{
  "error": "You must have an active reservation to view the address"
}
```

Error (404):
```json
{
  "error": "No shipping address available"
}
```

---

## Status Values

### Reservation Statuses
- `AVAILABLE` — No active reservation
- `RESERVED` — Guest has reserved, not yet purchased
- `PURCHASED_GUEST_CONFIRMED` — Guest confirmed purchase (guest-reported, not verified)
- `RECEIVED_HOST_CONFIRMED` — Host confirmed receipt
- `EXPIRED` — Reservation passed 48-hour expiry
- `CANCELLED` — Cancelled by guest or host

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid reservation data",
  "details": { "fieldErrors": {...} }
}
```

### 403 Forbidden
```json
{
  "error": "You must have an active reservation to view the address"
}
```

### 404 Not Found
```json
{
  "error": "Reservation not found"
}
```

### 409 Conflict
```json
{
  "error": "This item already has an active reservation"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create reservation"
}
```

---

## Authentication Notes
- Guest endpoints (POST /reservations) — No authentication required
- POST /reservations/[id]/confirm — No authentication required
- POST /addresses/reveal — Requires active reservation
- GET/POST/PUT/DELETE addresses — Owner authentication required (not implemented in demo)

---

## Rate Limiting
Not implemented in demo. Recommended for production:
- Reservations: 5 per minute per IP
- Address reveal: 10 per minute per reservation

---

## Expiry Logic
- Reservations expire after 48 hours (configurable)
- Expiry checked on creation; background job recommended for cleanup
- Expired reservations can be queried but prevent new active reservations on same product
