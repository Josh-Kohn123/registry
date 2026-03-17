import { NextRequest, NextResponse } from "next/server";
import {
  getEventById,
  getAddressesByProfile,
  getReservationById,
} from "@/lib/db";
import { PublicAddressReveal } from "@/types/address";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const eventId = (await params).eventId;
    const body = await request.json();
    const { reservationId, chosenAddressId } = body;

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
        { error: "You must have an active reservation to view the address" },
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

    // If chosenAddressId is provided, save it to the reservation
    if (chosenAddressId) {
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { chosenAddressId },
      });

      // Record the reveal
      await prisma.addressReveal.create({
        data: {
          addressId: chosenAddressId,
          guestEmail: reservation.guestEmail,
          guestName: reservation.guestName,
          reservationId,
        },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Get all addresses for selection
    const addresses = await getAddressesByProfile(ownerProfileId);

    if (addresses.length === 0) {
      return NextResponse.json(
        { error: "No shipping address available" },
        { status: 404 }
      );
    }

    // Return all addresses as options (labeled with city for privacy)
    const addressOptions: PublicAddressReveal[] = addresses.map((a) => ({
      id: a.id,
      recipientName: a.recipientName,
      phone: a.phone,
      city: a.city,
      line1: a.line1,
      line2: a.line2,
      postalCode: a.postalCode,
      notes: a.notes,
    }));

    return NextResponse.json(addressOptions, { status: 200 });
  } catch (error) {
    console.error("Failed to reveal address:", error);
    return NextResponse.json(
      { error: "Failed to reveal address" },
      { status: 500 }
    );
  }
}
