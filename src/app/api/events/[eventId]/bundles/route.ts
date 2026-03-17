import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bundleCreateSchema } from "@/lib/validators";
import {
  createBundle,
  getBundlesByEvent,
  getEventById,
  addBundleItem,
  getBundleById,
} from "@/lib/db";

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

// GET /api/events/[eventId]/bundles
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    // Verify event exists
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const bundles = await getBundlesByEvent(eventId);
    // Sort by position
    bundles.sort((a, b) => a.position - b.position);

    return NextResponse.json(bundles);
  } catch (error) {
    console.error("Error fetching bundles:", error);
    return NextResponse.json(
      { error: "Failed to fetch bundles" },
      { status: 500 }
    );
  }
}

// POST /api/events/[eventId]/bundles
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify event exists
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Verify user owns event
    if (!event.owners.some(o => o.profileId === user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = bundleCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Validate all items have the same base URL domain
    if (data.items && data.items.length > 0) {
      const getDomain = (url: string) => {
        try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
      };
      const domains = data.items.map((item) => getDomain(item.url)).filter(Boolean);
      const uniqueDomains = [...new Set(domains)];
      if (uniqueDomains.length > 1) {
        return NextResponse.json(
          { error: "All bundle items must come from the same store. Found: " + uniqueDomains.join(", ") },
          { status: 400 }
        );
      }
      // Auto-set storeDomain from items if not provided or override
      if (uniqueDomains.length === 1 && uniqueDomains[0]) {
        data.storeDomain = uniqueDomains[0];
      }
    }

    // Get current position (next position = max position + 1)
    const existingBundles = await getBundlesByEvent(eventId);
    const nextPosition = existingBundles.length > 0
      ? Math.max(...existingBundles.map(b => b.position)) + 1
      : 0;

    // Create bundle without items
    const { items, ...bundleData } = data;
    const bundle = await createBundle(eventId, {
      ...bundleData,
      eventId,
      position: nextPosition,
      isVisible: true,
    });

    // Add items to the bundle
    if (items && items.length > 0) {
      for (const item of items) {
        await addBundleItem(bundle.id, item);
      }
    }

    // Fetch the complete bundle with items
    const completeBundle = await getBundleById(bundle.id);

    return NextResponse.json(completeBundle, { status: 201 });
  } catch (error) {
    console.error("Error creating bundle:", error);
    return NextResponse.json(
      { error: "Failed to create bundle" },
      { status: 500 }
    );
  }
}
