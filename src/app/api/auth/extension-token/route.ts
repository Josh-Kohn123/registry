import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateExtensionToken } from "@/lib/extension-auth";
import { createExtensionToken } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's event
    const ownership = await prisma.eventOwner.findFirst({
      where: { profileId: user.id, role: "owner" },
      include: {
        event: {
          include: {
            _count: { select: { productLinks: true } },
          },
        },
      },
    });

    if (!ownership) {
      return NextResponse.json(
        { error: "No event found. Create an event first." },
        { status: 404 }
      );
    }

    // Generate and store token
    const { raw, hash } = generateExtensionToken();
    await createExtensionToken(user.id, hash);

    return NextResponse.json({
      token: raw,
      event: {
        id: ownership.event.id,
        title: ownership.event.title,
        productCount: ownership.event._count.productLinks,
      },
    });
  } catch (error) {
    console.error("Extension token generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
