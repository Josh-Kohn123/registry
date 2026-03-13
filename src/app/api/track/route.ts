import { NextRequest, NextResponse } from "next/server";
import { trackClickSchema } from "@/lib/validators";
import { createClickEvent } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP (simple approach)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(ip, 100, 60000)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = trackClickSchema.parse(body);

    // Record click event
    await createClickEvent(parsed.eventId, {
      eventId: parsed.eventId,
      targetType: parsed.targetType,
      targetId: parsed.targetId,
      clickedAt: new Date(),
      referrer: parsed.referrer,
      userAgent: parsed.hashedDevice,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Click tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track click" },
      { status: 400 }
    );
  }
}
