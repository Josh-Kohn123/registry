export type ReservationStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "PURCHASED_GUEST_CONFIRMED"
  | "RECEIVED_HOST_CONFIRMED"
  | "EXPIRED"
  | "CANCELLED";

export interface Reservation {
  id: string;
  eventId: string;
  guestName: string;
  guestEmail?: string;
  status: ReservationStatus;
  expiresAt?: Date;
  confirmedAt?: Date;
  receivedAt?: Date;
  productLinkId?: string;
  bundleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReservationWithItem extends Reservation {
  product?: {
    id: string;
    title: string;
    imageUrl?: string;
    estimatedPrice?: number;
    url: string;
  };
  bundle?: {
    id: string;
    title: string;
    imageUrl?: string;
    targetAmount: number;
  };
}

export interface CreateReservationInput {
  guestName: string;
  guestEmail?: string;
  productLinkId?: string;
  bundleId?: string;
}

export interface ConfirmPurchaseInput {
  guestEmail?: string;
}

export interface UpdateReservationInput {
  status?: ReservationStatus;
}
