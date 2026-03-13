import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  disableEventSchema,
} from "@/lib/validators";
import {
  updateEvent,
  createAdminAction,
} from "@/lib/db";

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  // Check admin secret key from header
  const adminKey = request.headers.get("x-admin-key");
  if (adminKey === process.env.ADMIN_SECRET_KEY) {
    return true;
  }

  // Fallback: authenticated user + admin key in query param
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const queryKey = request.nextUrl.searchParams.get("admin_key");
  return queryKey === process.env.ADMIN_SECRET_KEY;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await verifyAdmin(request))) {
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

    // Search events by slug or title
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { slug: { contains: query, mode: "insensitive" } },
          { title: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { owners: true },
      take: 20,
    });

    return NextResponse.json({ results: events });
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
    if (!(await verifyAdmin(request))) {
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
