import { NextRequest, NextResponse } from "next/server";
import { fundUpdateSchema } from "@/lib/validators";
import {
  getFundById,
  updateFund,
  deleteFund,
  getEventById,
} from "@/lib/db";

interface RouteParams {
  params: Promise<{
    eventId: string;
    fundId: string;
  }>;
}

// PUT /api/events/[eventId]/funds/[fundId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId, fundId } = await params;

    // TODO: Add authentication check
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
    const validationResult = fundUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updatedFund = await updateFund(fundId, validationResult.data);

    return NextResponse.json(updatedFund);
  } catch (error) {
    console.error("Error updating fund:", error);
    return NextResponse.json(
      { error: "Failed to update fund" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[eventId]/funds/[fundId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId, fundId } = await params;

    // TODO: Add authentication check
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

    await deleteFund(fundId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting fund:", error);
    return NextResponse.json(
      { error: "Failed to delete fund" },
      { status: 500 }
    );
  }
}
