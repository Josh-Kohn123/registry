import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getEventById,
  getProductsByEvent,
  createProduct,
} from "@/lib/db";
import { productCreateSchema } from "@/lib/validators";
import { isRetailerWhitelisted, extractDomain, getRetailerName } from "@/lib/retailer-whitelist";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }>  }
) {
  try {
    const event = await getEventById((await params).eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const products = await getProductsByEvent((await params).eventId);

    // Return public data (don't expose all internal fields)
    const publicProducts = products.map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      retailerDomain: p.retailerDomain,
      imageUrl: p.imageUrl,
      estimatedPrice: p.estimatedPrice,
      isVisible: p.isVisible,
      position: p.position,
    }));

    return NextResponse.json(publicProducts);
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }>  }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await getEventById((await params).eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user is owner
    const isOwner = event.owners.some((owner) => owner.profileId === user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = productCreateSchema.parse(body);

    // Validate retailer whitelist
    if (!isRetailerWhitelisted(validatedData.url)) {
      return NextResponse.json(
        { error: "Retailer is not whitelisted" },
        { status: 400 }
      );
    }

    const domain = extractDomain(validatedData.url);
    if (!domain) {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      );
    }

    // Use provided title or fallback to domain
    const title = validatedData.title || getRetailerName(domain);

    const eventId = (await params).eventId;
    const product = await createProduct(eventId, {
      eventId,
      title,
      description: undefined,
      url: validatedData.url,
      retailerDomain: domain,
      imageUrl: validatedData.imageUrl,
      estimatedPrice: validatedData.estimatedPrice,
      isVisible: true,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
