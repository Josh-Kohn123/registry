import { NextRequest, NextResponse } from "next/server";
import { reservationCreateSchema } from "@/lib/validators";
import {
  getEventById,
  createReservation,
  getReservationsByEvent,
  getActiveReservationByProduct,
  getActiveReservationByBundle,
} from "@/lib/db";

const RESERVATION_EXPIRY_HOURS = 48;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }>  }
) {
  try {
    // In production, verify owner authentication
    const eventId = (await params).eventId;

    const reservations = await getReservationsByEvent(eventId);

    return NextResponse.json(reservations, { status: 200 });
  } catch (error) {
    console.error("Failed to get reservations:", error);
    return NextResponse.json(
      { error: "Failed to get reservations" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }>  }
) {
  try {
    const eventId = (await params).eventId;
    const body = await request.json();

    // Validate input
    const result = reservationCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid reservation data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { guestName, guestEmail, productLinkId, bundleId } = result.data;

    // Verify event exists
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check for existing active reservation
    if (productLinkId) {
      const activeReservation = await getActiveReservationByProduct(productLinkId);
      if (activeReservation && !isExpired(activeReservation.expiresAt)) {
        return NextResponse.json(
          { error: "This item already has an active reservation" },
          { status: 409 }
        );
      }
    }

    if (bundleId) {
      const activeReservation = await getActiveReservationByBundle(bundleId);
      if (activeReservation && !isExpired(activeReservation.expiresAt)) {
        return NextResponse.json(
          { error: "This item already has an active reservation" },
          { status: 409 }
        );
      }
    }

    // Create reservation
    const expiresAt = new Date(
      Date.now() + RESERVATION_EXPIRY_HOURS * 60 * 60 * 1000
    );

    const reservation = await createReservation(eventId, {
      eventId,
      guestName,
      guestEmail: guestEmail || undefined,
      status: "RESERVED",
      expiresAt,
      productLinkId,
      bundleId,
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error("Failed to create reservation:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}

function isExpired(expiresAt?: Date): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}
