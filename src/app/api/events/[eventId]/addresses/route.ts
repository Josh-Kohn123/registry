import { NextRequest, NextResponse } from "next/server";
import { addressCreateSchema } from "@/lib/validators";
import { getEventById, createAddress, getAddressesByProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }>  }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = (await params).eventId;
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only owners can fetch addresses
    const isOwner = event.owners.some((owner) => owner.profileId === user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const addresses = await getAddressesByProfile(user.id);
    return NextResponse.json(addresses, { status: 200 });
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

    // If this is the first address or marked as default, enforce single default
    const existingAddresses = await getAddressesByProfile(ownerProfileId);
    const isDefault = result.data.isDefault ?? (existingAddresses.length === 0);
    if (isDefault) {
      // Unset default on all other addresses
      for (const addr of existingAddresses) {
        if (addr.isDefault) {
          await prisma.address.update({
            where: { id: addr.id },
            data: { isDefault: false },
          });
        }
      }
    }

    const address = await createAddress(ownerProfileId, {
      ...result.data,
      isDefault,
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
