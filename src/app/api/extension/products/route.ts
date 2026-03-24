import { NextRequest, NextResponse } from "next/server";
import { validateExtensionToken, extractBearerToken } from "@/lib/extension-auth";
import { createProduct } from "@/lib/db";
import { extensionProductSchema } from "@/lib/validators";
import { isRetailerWhitelisted, extractDomain } from "@/lib/retailer-whitelist";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    // Auth via Bearer token
    const raw = extractBearerToken(request.headers.get("authorization"));
    if (!raw) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = await validateExtensionToken(raw);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const data = extensionProductSchema.parse(body);

    // Validate whitelist
    if (!(await isRetailerWhitelisted(data.url))) {
      return NextResponse.json(
        { error: "Retailer is not whitelisted" },
        { status: 403 }
      );
    }

    const domain = extractDomain(data.url);
    if (!domain) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Find user's event (single-event model: get their first owned event)
    const ownership = await prisma.eventOwner.findFirst({
      where: { profileId: auth.profileId, role: "owner" },
      include: { event: true },
    });

    if (!ownership) {
      return NextResponse.json(
        { error: "No event found" },
        { status: 404 }
      );
    }

    const eventId = ownership.eventId;

    // Check for duplicate URL in this event
    const existing = await prisma.productLink.findFirst({
      where: {
        eventId,
        url: data.url,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Product already in registry" },
        { status: 409 }
      );
    }

    // Create the product
    const product = await createProduct(eventId, {
      eventId,
      title: data.title,
      description: undefined,
      url: data.url,
      retailerDomain: domain,
      category: "other",
      imageUrl: data.imageUrl,
      estimatedPrice: data.estimatedPrice,
      isVisible: true,
    });

    return NextResponse.json(
      {
        id: product.id,
        title: product.title,
        retailerDomain: product.retailerDomain,
        imageUrl: product.imageUrl,
        estimatedPrice: product.estimatedPrice,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.flatten().fieldErrors },
        { status: 422 }
      );
    }
    console.error("Extension product creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
