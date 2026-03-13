import { NextRequest, NextResponse } from "next/server";
import { confirmPurchaseSchema } from "@/lib/validators";
import { getReservationById, updateReservation } from "@/lib/db";

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ eventId: string; reservationId: string }>;
  }
) {
  try {
    const { reservationId } = await params;
    const body = await request.json();

    // Validate input
    const result = confirmPurchaseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid confirmation data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify reservation exists
    const reservation = await getReservationById(reservationId);
    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Only allow confirmation from RESERVED status
    if (reservation.status !== "RESERVED") {
      return NextResponse.json(
        {
          error: "Can only confirm a reservation that is in RESERVED status",
        },
        { status: 400 }
      );
    }

    // Update reservation to PURCHASED_GUEST_CONFIRMED
    const updated = await updateReservation(reservationId, {
      status: "PURCHASED_GUEST_CONFIRMED",
      confirmedAt: new Date(),
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Failed to confirm purchase:", error);
    return NextResponse.json(
      { error: "Failed to confirm purchase" },
      { status: 500 }
    );
  }
}
