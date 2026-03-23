import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { reservationCreateSchema } from "@/lib/validators";
import {
  getEventById,
  createReservation,
  getReservationsByEvent,
  getReservationsWithItemsByEvent,
  getActiveReservationByProduct,
  getActiveReservationByBundle,
  getReservationWithItemsById,
  getAddressesByProfile,
} from "@/lib/db";
import { sendEmail } from "@/lib/email";
import ReservationConfirmation from "@/emails/ReservationConfirmation";
import type { EmailLocale } from "@/emails/translations";
import { t } from "@/emails/translations";

const RESERVATION_EXPIRY_HOURS = 24;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const eventId = (await params).eventId;
    const url = new URL(request.url);
    const includeItems = url.searchParams.get("includeItems") === "true";

    const reservations = includeItems
      ? await getReservationsWithItemsByEvent(eventId)
      : await getReservationsByEvent(eventId);

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
  { params }: { params: Promise<{ eventId: string }> }
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

    const { guestName, guestEmail, guestPhone, guestMessage, locale, productLinkId, bundleId } = result.data;

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

    // Create reservation with 24hr expiry
    const expiresAt = new Date(
      Date.now() + RESERVATION_EXPIRY_HOURS * 60 * 60 * 1000
    );
    const cancelToken = crypto.randomUUID();

    const reservation = await createReservation(eventId, {
      eventId,
      guestName,
      guestEmail: guestEmail,
      guestPhone: guestPhone || undefined,
      guestMessage: guestMessage || undefined,
      status: "RESERVED",
      expiresAt,
      cancelToken,
      locale: locale || event.locale || "en",
      productLinkId,
      bundleId,
    });

    // Fire-and-forget: send confirmation email
    sendConfirmationEmail(reservation.id, guestEmail).catch((err) => {
      console.error("[reservation] Email sending failed:", err);
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


/**
 * Sends the reservation confirmation email with gift details and shipping addresses.
 * This runs as a fire-and-forget background task — failures are logged but don't block the API.
 */
async function sendConfirmationEmail(reservationId: string, guestEmail: string) {
  const reservationData = await getReservationWithItemsById(reservationId);
  if (!reservationData) {
    console.error("[email] Reservation not found for email:", reservationId);
    return;
  }

  const emailLocale = (reservationData.locale || "en") as EmailLocale;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Build confirm/cancel URLs using the cancelToken
  const confirmUrl = `${siteUrl}/api/reservations/${reservationId}/confirm-email?token=${reservationData.cancelToken}`;
  const cancelUrl = `${siteUrl}/api/reservations/${reservationId}/cancel?token=${reservationData.cancelToken}`;

  // Build items list for the email
  const items: { title: string; imageUrl?: string; url: string; estimatedPrice?: number }[] = [];

  if (reservationData.product) {
    items.push({
      title: reservationData.product.title,
      imageUrl: reservationData.product.imageUrl,
      url: reservationData.product.url,
      estimatedPrice: reservationData.product.estimatedPrice,
    });
  } else if (reservationData.bundle) {
    // For bundles, list all individual items
    for (const item of reservationData.bundle.items || []) {
      items.push({
        title: item.title,
        imageUrl: item.imageUrl,
        url: item.url,
        estimatedPrice: item.estimatedPrice,
      });
    }
  }

  // Fetch shipping addresses from the event owner's profile
  const addresses: { recipientName: string; line1: string; line2?: string; city: string; postalCode?: string; phone?: string; notes?: string }[] = [];

  if (reservationData.event?.ownerProfileIds?.length) {
    for (const profileId of reservationData.event.ownerProfileIds) {
      const profileAddresses = await getAddressesByProfile(profileId);
      for (const addr of profileAddresses) {
        addresses.push({
          recipientName: addr.recipientName,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          postalCode: addr.postalCode,
          phone: addr.phone,
          notes: addr.notes,
        });
      }
    }
  }

  const coupleName = [reservationData.event?.coupleFirstName, reservationData.event?.coupleSecondName]
    .filter(Boolean)
    .join(" & ");
  const eventTitle = reservationData.event?.title || "";

  const subject = t(emailLocale, "confirmationSubject", { eventTitle });

  await sendEmail({
    to: guestEmail,
    subject,
    react: ReservationConfirmation({
      guestName: reservationData.guestName,
      locale: emailLocale,
      eventTitle,
      coupleName,
      items,
      addresses,
      confirmUrl,
      cancelUrl,
    }),
  });
}
