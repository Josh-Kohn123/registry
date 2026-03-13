import { NextRequest, NextResponse } from "next/server";
import {
  getEventById,
  getAddressesByProfile,
  getReservationById,
  getReservationsByEvent,
} from "@/lib/db";
import { PublicAddressReveal } from "@/types/address";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }>  }
) {
  try {
    const eventId = (await params).eventId;
    const body = await request.json();
    const { reservationId } = body;

    if (!reservationId) {
      return NextResponse.json(
        { error: "Reservation ID is required" },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Verify reservation exists and belongs to this event
    const reservation = await getReservationById(reservationId);
    if (!reservation || reservation.eventId !== eventId) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check if reservation is active
    if (
      reservation.status !== "RESERVED" &&
      reservation.status !== "PURCHASED_GUEST_CONFIRMED"
    ) {
      return NextResponse.json(
        {
          error:
            "You must have an active reservation to view the address",
        },
        { status: 403 }
      );
    }

    // Get owner profile ID from event
    const ownerProfileId = event.owners[0]?.profileId;
    if (!ownerProfileId) {
      return NextResponse.json(
        { error: "No owner found for event" },
        { status: 400 }
      );
    }

    // Get addresses (default address first)
    const addresses = await getAddressesByProfile(ownerProfileId);
    const defaultAddress =
      addresses.find((a) => a.isDefault) || addresses[0];

    if (!defaultAddress) {
      return NextResponse.json(
        { error: "No shipping address available" },
        { status: 404 }
      );
    }

    // Return address without encryptedData flag
    const revealed: PublicAddressReveal = {
      id: defaultAddress.id,
      recipientName: defaultAddress.recipientName,
      phone: defaultAddress.phone,
      city: defaultAddress.city,
      line1: defaultAddress.line1,
      line2: defaultAddress.line2,
      postalCode: defaultAddress.postalCode,
      notes: defaultAddress.notes,
    };

    return NextResponse.json(revealed, { status: 200 });
  } catch (error) {
    console.error("Failed to reveal address:", error);
    return NextResponse.json(
      { error: "Failed to reveal address" },
      { status: 500 }
    );
  }
}
