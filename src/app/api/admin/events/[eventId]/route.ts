import { NextRequest, NextResponse } from "next/server";
import { getEventById, updateEvent, createAdminAction } from "@/lib/db";

async function isAdmin(userId?: string): Promise<boolean> {
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const event = await getEventById((await params).eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { isDisabled, reason } = body;

    const updated = await updateEvent((await params).eventId, {
      isDisabled,
    } as any);

    if (!updated) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Log admin action
    if (isDisabled !== undefined) {
      const eventId = (await params).eventId;
      await createAdminAction(eventId, {
        eventId,
        actionType: isDisabled ? "disable_event" : "enable_event",
        reason,
        metadata: {},
      });
    }

    return NextResponse.json({
      success: true,
      event: updated,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}
