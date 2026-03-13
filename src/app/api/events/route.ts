import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { eventCreationSchema } from "@/lib/validators";
import {
  createEvent,
  getUserEvents,
  generateSlug,
  findUniqueSlug,
  ensureProfile,
} from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = eventCreationSchema.parse(body);

    // Generate slug
    let slug = validatedData.slug;
    if (!slug) {
      const baseSlug = generateSlug(
        validatedData.coupleFirstName,
        validatedData.coupleSecondName
      );
      slug = await findUniqueSlug(baseSlug);
    }

    // Ensure user profile exists in DB
    await ensureProfile(user.id, user.email || "");

    // Create event - convert eventDate string to Date or null
    const eventDate = validatedData.eventDate
      ? new Date(validatedData.eventDate)
      : undefined;

    const createData: any = {
      ...validatedData,
      slug,
      eventDate,
      minProductPrice: 360,
      isPublished: false,
      isDisabled: false,
      owners: [
        {
          id: `owner-${Date.now()}`,
          profileId: user.id,
          role: "owner",
        },
      ],
    };

    const event = await createEvent(createData as any);

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error("Event creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events = await getUserEvents(user.id);

    return NextResponse.json(events);
  } catch (error) {
    console.error("Event fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
