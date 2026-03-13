import { NextRequest, NextResponse } from "next/server";
import { fetchMetadata } from "@/lib/metadata";
import { isRetailerWhitelisted } from "@/lib/retailer-whitelist";
import { metadataFetchSchema } from "@/lib/validators";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = metadataFetchSchema.parse(body);

    // Validate retailer whitelist
    if (!isRetailerWhitelisted(validatedData.url)) {
      return NextResponse.json(
        {
          success: false,
          error: "Retailer is not whitelisted",
        },
        { status: 400 }
      );
    }

    const result = await fetchMetadata(validatedData.url);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to fetch metadata",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    console.error("Metadata fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
