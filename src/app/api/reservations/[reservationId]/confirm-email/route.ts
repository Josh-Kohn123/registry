import { NextRequest, NextResponse } from "next/server";
import { getReservationByCancelToken, updateReservation } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const { reservationId } = await params;
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Look up reservation by cancel token for security
    const reservation = await getReservationByCancelToken(token);

    if (!reservation || reservation.id !== reservationId) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    if (reservation.status !== "RESERVED") {
      // Already confirmed, cancelled, or expired — redirect to confirmed page anyway
      const locale = reservation.locale || "en";
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      return NextResponse.redirect(`${siteUrl}/${locale}/purchase-confirmed`);
    }

    // Confirm the purchase
    await updateReservation(reservationId, {
      status: "PURCHASED_GUEST_CONFIRMED",
      confirmedAt: new Date(),
    });

    const locale = reservation.locale || "en";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return NextResponse.redirect(`${siteUrl}/${locale}/purchase-confirmed`);
  } catch (error) {
    console.error("Failed to confirm reservation:", error);
    return NextResponse.json(
      { error: "Failed to confirm reservation" },
      { status: 500 }
    );
  }
}
