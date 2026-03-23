import { NextRequest, NextResponse } from "next/server";
import {
  getReservationsDueForReminder,
  getExpiredReservations,
  markReservationsExpired,
  updateReservation,
  getReservationWithItemsById,
} from "@/lib/db";
import { sendEmail } from "@/lib/email";
import ReservationReminder from "@/emails/ReservationReminder";
import ReservationExpired from "@/emails/ReservationExpired";
import type { EmailLocale } from "@/emails/translations";
import { t } from "@/emails/translations";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    remindersSent: 0,
    expirationsProcessed: 0,
    errors: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Send reminders for reservations older than 1 hour
    const dueForReminder = await getReservationsDueForReminder();

    for (const reservation of dueForReminder) {
      try {
        if (!reservation.guestEmail) continue;

        const fullData = await getReservationWithItemsById(reservation.id);
        if (!fullData) continue;

        const emailLocale = (reservation.locale || "en") as EmailLocale;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const confirmUrl = `${siteUrl}/api/reservations/${reservation.id}/confirm-email?token=${reservation.cancelToken}`;
        const cancelUrl = `${siteUrl}/api/reservations/${reservation.id}/cancel?token=${reservation.cancelToken}`;

        const coupleName = [fullData.event?.coupleFirstName, fullData.event?.coupleSecondName]
          .filter(Boolean)
          .join(" & ");
        const eventTitle = fullData.event?.title || "";

        // Build items list
        const items: { title: string; imageUrl?: string; url: string; estimatedPrice?: number }[] = [];
        if (fullData.product) {
          items.push({
            title: fullData.product.title,
            imageUrl: fullData.product.imageUrl,
            url: fullData.product.url,
            estimatedPrice: fullData.product.estimatedPrice,
          });
        } else if (fullData.bundle?.items) {
          for (const item of fullData.bundle.items) {
            items.push({
              title: item.title,
              imageUrl: item.imageUrl,
              url: item.url,
              estimatedPrice: item.estimatedPrice,
            });
          }
        }

        const subject = t(emailLocale, "reminderSubject", { eventTitle });

        await sendEmail({
          to: reservation.guestEmail,
          subject,
          react: ReservationReminder({
            guestName: reservation.guestName,
            locale: emailLocale,
            eventTitle,
            coupleName,
            items,
            confirmUrl,
            cancelUrl,
          }),
        });

        // Mark reminder as sent
        await updateReservation(reservation.id, { reminderSentAt: new Date() });
        results.remindersSent++;
      } catch (err) {
        console.error(`[cron] Failed to send reminder for ${reservation.id}:`, err);
        results.errors++;
      }
    }

    // 2. Process expired reservations
    const expired = await getExpiredReservations();

    if (expired.length > 0) {
      const ids = expired.map((r) => r.id);
      await markReservationsExpired(ids);

      // Send expiry notification emails
      for (const reservation of expired) {
        try {
          if (!reservation.guestEmail) continue;

          const fullData = await getReservationWithItemsById(reservation.id);
          if (!fullData) continue;

          const emailLocale = (reservation.locale || "en") as EmailLocale;
          const coupleName = [fullData.event?.coupleFirstName, fullData.event?.coupleSecondName]
            .filter(Boolean)
            .join(" & ");
          const eventTitle = fullData.event?.title || "";
          const itemTitle = fullData.product?.title || fullData.bundle?.title || "";

          const subject = t(emailLocale, "expiredSubject");

          await sendEmail({
            to: reservation.guestEmail,
            subject,
            react: ReservationExpired({
              guestName: reservation.guestName,
              locale: emailLocale,
              eventTitle,
              coupleName,
              itemTitle,
            }),
          });

          results.expirationsProcessed++;
        } catch (err) {
          console.error(`[cron] Failed to send expiry email for ${reservation.id}:`, err);
          results.errors++;
        }
      }
    }

    console.log("[cron] reservation-reminders completed:", results);
    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("[cron] reservation-reminders failed:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    );
  }
}
