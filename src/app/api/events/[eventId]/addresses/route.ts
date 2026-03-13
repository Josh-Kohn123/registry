import { NextRequest, NextResponse } from "next/server";
import { addressCreateSchema } from "@/lib/validators";
import { getEventById, createAddress } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }>  }
) {
  try {
    // In production, verify owner authentication
    // For now, addresses are not returned to public; only owner can fetch them
    // This route should return empty array if not authenticated as owner
    return NextResponse.json([], { status: 200 });
  } catch (error) {
    console.error("Failed to get addresses:", error);
    return NextResponse.json(
      { error: "Failed to get addresses" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }>  }
) {
  try {
    const eventId = (await params).eventId;
    const body = await request.json();

    // Validate input
    const result = addressCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid address data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // In production, get profileId from authenticated user
    // For demo, use the first owner's profile ID
    const ownerProfileId = event.owners[0]?.profileId;
    if (!ownerProfileId) {
      return NextResponse.json(
        { error: "No owner found for event" },
        { status: 400 }
      );
    }

    // Create address
    const address = await createAddress(ownerProfileId, {
      ...result.data,
      profileId: ownerProfileId,
      encryptedData: true,
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error("Failed to create address:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}
