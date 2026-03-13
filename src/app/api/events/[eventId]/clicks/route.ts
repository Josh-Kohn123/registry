import { NextRequest, NextResponse } from "next/server";
import { getEventById } from "@/lib/db";
import { getClickEventsByEvent } from "@/lib/db";
import { getProductsByEvent, getFundsByEvent, getBundlesByEvent } from "@/lib/db";

// Mock auth check - in real app, verify JWT token
async function isEventOwner(eventId: string, userId?: string): Promise<boolean> {
  const event = await getEventById(eventId);
  if (!event) return false;
  // In real app: check if userId is in event.owners
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

    // Get all click events for this event
    const clickEvents = await getClickEventsByEvent(eventId);

    // Fetch items for enrichment
    const products = await getProductsByEvent(eventId);
    const funds = await getFundsByEvent(eventId);
    const bundles = await getBundlesByEvent(eventId);

    // Aggregate clicks by item
    const clicksByItem = new Map<string, any>();

    clickEvents.forEach((event) => {
      const key = `${event.targetType}_${event.targetId}`;
      if (!clicksByItem.has(key)) {
        let title = "Unknown";
        if (event.targetType === "product") {
          title = products.find((p) => p.id === event.targetId)?.title || title;
        } else if (event.targetType === "fund") {
          title = funds.find((f) => f.id === event.targetId)?.title || title;
        } else if (event.targetType === "bundle") {
          title = bundles.find((b) => b.id === event.targetId)?.title || title;
        }

        clicksByItem.set(key, {
          targetId: event.targetId,
          targetType: event.targetType,
          title,
          clickCount: 0,
        });
      }

      const item = clicksByItem.get(key);
      item.clickCount++;
    });

    return NextResponse.json({
      eventId,
      totalClicks: clickEvents.length,
      clicksByItem: Array.from(clicksByItem.values()),
    });
  } catch (error) {
    console.error("Error fetching click stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch click stats" },
      { status: 500 }
    );
  }
}
