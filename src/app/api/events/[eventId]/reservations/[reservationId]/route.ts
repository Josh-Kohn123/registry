import { NextRequest, NextResponse } from "next/server";
import { reservationUpdateSchema } from "@/lib/validators";
import {
  getReservationById,
  updateReservation,
  deleteReservation,
} from "@/lib/db";

export async function PUT(
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
    const result = reservationUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid update data", details: result.error.flatten() },
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

    // Update reservation
    const updated = await updateReservation(reservationId, result.data);

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Failed to update reservation:", error);
    return NextResponse.json(
      { error: "Failed to update reservation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ eventId: string; reservationId: string }>;
  }
) {
  try {
    const { reservationId } = await params;

    // Verify reservation exists
    const reservation = await getReservationById(reservationId);
    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Delete reservation
    await deleteReservation(reservationId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete reservation:", error);
    return NextResponse.json(
      { error: "Failed to delete reservation" },
      { status: 500 }
    );
  }
}
