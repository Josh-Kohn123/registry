import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { eventCreationSchema } from "@/lib/validators";
import {
  createEvent,
  getUserEvents,
  generateSlug,
  findUniqueSlug,
} from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
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

    // Create event
    const createData: any = {
      ...validatedData,
      slug,
      minProductPrice: 360,
      isPublished: false,
      isDisabled: false,
      owners: [
        {
          id: `owner-${Date.now()}`,
          profileId: session.user.id,
          role: "owner",
        },
      ],
    };
    // Convert eventDate from string to Date if provided
    if (validatedData.eventDate) {
      createData.eventDate = new Date(validatedData.eventDate);
    }

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
    // Check authentication
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's events
    const events = await getUserEvents(session.user.id);

    return NextResponse.json(events);
  } catch (error) {
    console.error("Event fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { z } from "zod";
