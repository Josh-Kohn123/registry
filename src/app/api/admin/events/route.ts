import { NextRequest, NextResponse } from "next/server";
import {
  searchEventsSchema,
  disableEventSchema,
} from "@/lib/validators";
import {
  getUserEvents,
  updateEvent,
  createAdminAction,
  getAllReports,
} from "@/lib/db";

// Mock admin check - in real app, verify admin role from JWT
async function isAdmin(userId?: string): Promise<boolean> {
  // In real app: check if user has admin role
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 1) {
      return NextResponse.json(
        { error: "Search query required" },
        { status: 400 }
      );
    }

    // Search by slug or owner email (simplified)
    const allEvents = await getUserEvents("dummy"); // In real app, get all events
    const results: typeof allEvents = []; // In mock, return empty; real implementation would search

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching events:", error);
    return NextResponse.json(
      { error: "Failed to search events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { eventId, action, reason } = body;

    if (action === "disable") {
      const parsed = disableEventSchema.parse({ reason });

      const updated = await updateEvent(eventId, {
        isDisabled: true,
      } as any);

      if (updated) {
        await createAdminAction(eventId, {
          eventId,
          actionType: "disable_event",
          reason: parsed.reason,
          metadata: {},
        });
      }

      return NextResponse.json({
        success: true,
        message: "Event disabled",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error disabling event:", error);
    return NextResponse.json(
      { error: "Failed to disable event" },
      { status: 500 }
    );
  }
}
