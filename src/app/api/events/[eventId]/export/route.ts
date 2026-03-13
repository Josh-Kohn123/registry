import { NextRequest, NextResponse } from "next/server";
import { getEventById } from "@/lib/db";
import { getProductsByEvent, getFundsByEvent, getBundlesByEvent } from "@/lib/db";
import { getReservationsByEvent } from "@/lib/db";
import { getFundContributions, getBundleContributions } from "@/lib/db";

// Mock auth check
async function isEventOwner(eventId: string, userId?: string): Promise<boolean> {
  const event = await getEventById(eventId);
  if (!event) return false;
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }>  }
) {
  try {
    const eventId = (await params).eventId;
    const isOwner = await isEventOwner(eventId);

    if (!isOwner) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Fetch all gift data
    const products = await getProductsByEvent(eventId);
    const funds = await getFundsByEvent(eventId);
    const bundles = await getBundlesByEvent(eventId);
    const reservations = await getReservationsByEvent(eventId);

    // Build CSV rows
    const rows: string[] = [];
    rows.push(
      "Type,Title,Status,Guest Name,Amount/Value,Date"
    );

    // Add product reservations
    for (const product of products) {
      const productReservations = reservations.filter(
        (r) => r.productLinkId === product.id
      );

      if (productReservations.length === 0) {
        rows.push(
          `Product,"${product.title}",Available,,,${product.createdAt.toISOString()}`
        );
      } else {
        for (const res of productReservations) {
          rows.push(
            `Product,"${product.title}",${res.status},"${res.guestName}",ILS ${product.estimatedPrice || "N/A"},${res.createdAt.toISOString()}`
          );
        }
      }
    }

    // Add fund contributions
    for (const fund of funds) {
      const contributions = await getFundContributions(fund.id);

      if (contributions.length === 0) {
        rows.push(
          `Fund,"${fund.title}",Available,,,${fund.createdAt.toISOString()}`
        );
      } else {
        for (const contrib of contributions) {
          rows.push(
            `Fund,"${fund.title}",Contributed,"${contrib.guestName || "Anonymous"}",ILS ${contrib.reportedAmount},${contrib.createdAt.toISOString()}`
          );
        }
      }
    }

    // Add bundle contributions
    for (const bundle of bundles) {
      const contributions = await getBundleContributions(bundle.id);
      const bundleReservations = reservations.filter(
        (r) => r.bundleId === bundle.id
      );

      if (bundleReservations.length === 0 && contributions.length === 0) {
        rows.push(
          `Bundle,"${bundle.title}",Available,,,${bundle.createdAt.toISOString()}`
        );
      } else {
        for (const res of bundleReservations) {
          rows.push(
            `Bundle,"${bundle.title}",${res.status},"${res.guestName}",ILS ${bundle.targetAmount},${res.createdAt.toISOString()}`
          );
        }
        for (const contrib of contributions) {
          rows.push(
            `Bundle,"${bundle.title}",Contributed,"${contrib.guestName || "Anonymous"}",ILS ${contrib.amount},${contrib.createdAt.toISOString()}`
          );
        }
      }
    }

    const csv = rows.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${event.slug}-gifts-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting gifts:", error);
    return NextResponse.json(
      { error: "Failed to export gifts" },
      { status: 500 }
    );
  }
}
