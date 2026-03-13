import { NextRequest, NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const event = await getEventBySlug(slug);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Return public event data (no addresses, no owner details)
    return NextResponse.json({
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      eventDate: event.eventDate,
      eventType: event.eventType,
      coverImageUrl: event.coverImageUrl,
      locale: event.locale,
      isPublished: event.isPublished,
    });
  } catch (error) {
    console.error("Error fetching event by slug:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
