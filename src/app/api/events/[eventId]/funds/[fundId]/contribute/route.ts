import { NextRequest, NextResponse } from "next/server";
import { fundContributeSchema } from "@/lib/validators";
import {
  getFundById,
  createFundContribution,
  incrementFundClickCount,
  getEventById,
} from "@/lib/db";

interface RouteParams {
  params: Promise<{
    eventId: string;
    fundId: string;
  }>;
}

// POST /api/events/[eventId]/funds/[fundId]/contribute
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();

    // Validate input
    const validationResult = fundContributeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create contribution record (guest-reported, not verified)
    const contribution = await createFundContribution(fundId, {
      ...data,
      fundId,
    });

    // Increment fund click count for analytics
    await incrementFundClickCount(fundId);

    return NextResponse.json(contribution, { status: 201 });
  } catch (error) {
    console.error("Error creating contribution:", error);
    return NextResponse.json(
      { error: "Failed to record contribution" },
      { status: 500 }
    );
  }
}
