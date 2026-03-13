import { NextRequest, NextResponse } from "next/server";
import {
  getFundById,
  getFundContributions,
  getEventById,
} from "@/lib/db";

interface RouteParams {
  params: Promise<{
    eventId: string;
    fundId: string;
  }>;
}

// GET /api/events/[eventId]/funds/[fundId]/contributions
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId, fundId } = await params;

    // Verify event exists
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Verify fund exists and belongs to event
    const fund = await getFundById(fundId);
    if (!fund || fund.eventId !== eventId) {
      return NextResponse.json(
        { error: "Fund not found" },
        { status: 404 }
      );
    }

    const contributions = await getFundContributions(fundId);

    return NextResponse.json(contributions);
  } catch (error) {
    console.error("Error fetching contributions:", error);
    return NextResponse.json(
      { error: "Failed to fetch contributions" },
      { status: 500 }
    );
  }
}
