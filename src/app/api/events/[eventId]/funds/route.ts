import { NextRequest, NextResponse } from "next/server";
import { fundCreateSchema } from "@/lib/validators";
import {
  createFund,
  getFundsByEvent,
  getEventById,
} from "@/lib/db";

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

// GET /api/events/[eventId]/funds
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    // Verify event exists
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const funds = await getFundsByEvent(eventId);
    // Sort by position
    funds.sort((a, b) => a.position - b.position);

    return NextResponse.json(funds);
  } catch (error) {
    console.error("Error fetching funds:", error);
    return NextResponse.json(
      { error: "Failed to fetch funds" },
      { status: 500 }
    );
  }
}

// POST /api/events/[eventId]/funds
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    // TODO: Add authentication check here
    // const session = await getSession();
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Verify event exists
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // TODO: Verify user owns event
    // if (!event.owners.some(o => o.profileId === session.user.id)) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    const body = await request.json();

    // Validate input
    const validationResult = fundCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Get current position (next position = max position + 1)
    const existingFunds = await getFundsByEvent(eventId);
    const nextPosition = existingFunds.length > 0
      ? Math.max(...existingFunds.map(f => f.position)) + 1
      : 0;

    const fund = await createFund(eventId, {
      ...data,
      eventId,
      position: nextPosition,
      isVisible: true,
    });

    return NextResponse.json(fund, { status: 201 });
  } catch (error) {
    console.error("Error creating fund:", error);
    return NextResponse.json(
      { error: "Failed to create fund" },
      { status: 500 }
    );
  }
}
