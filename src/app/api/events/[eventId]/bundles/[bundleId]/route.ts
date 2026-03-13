import { NextRequest, NextResponse } from "next/server";
import { bundleUpdateSchema } from "@/lib/validators";
import {
  getBundleById,
  updateBundle,
  deleteBundle,
  addBundleItem,
  removeBundleItem,
} from "@/lib/db";

interface RouteParams {
  params: Promise<{
    eventId: string;
    bundleId: string;
  }>;
}

// GET /api/events/[eventId]/bundles/[bundleId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { bundleId } = await params;

    const bundle = await getBundleById(bundleId);
    if (!bundle) {
      return NextResponse.json(
        { error: "Bundle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(bundle);
  } catch (error) {
    console.error("Error fetching bundle:", error);
    return NextResponse.json(
      { error: "Failed to fetch bundle" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[eventId]/bundles/[bundleId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { bundleId } = await params;

    // TODO: Add authentication check here

    const bundle = await getBundleById(bundleId);
    if (!bundle) {
      return NextResponse.json(
        { error: "Bundle not found" },
        { status: 404 }
      );
    }

    // TODO: Verify user owns event

    const body = await request.json();

    // Validate input
    const validationResult = bundleUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Handle items update if provided
    if (data.items && Array.isArray(data.items)) {
      // Remove existing items
      const existingItems = bundle.items;
      for (const item of existingItems) {
        await removeBundleItem(item.id);
      }

      // Add new items
      for (const item of data.items) {
        await addBundleItem(bundleId, item);
      }
    }

    // Update bundle (without items in the update)
    const { items, ...updateData } = data;
    const updatedBundle = await updateBundle(bundleId, updateData);

    return NextResponse.json(updatedBundle);
  } catch (error) {
    console.error("Error updating bundle:", error);
    return NextResponse.json(
      { error: "Failed to update bundle" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[eventId]/bundles/[bundleId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { bundleId } = await params;

    // TODO: Add authentication check here

    const bundle = await getBundleById(bundleId);
    if (!bundle) {
      return NextResponse.json(
        { error: "Bundle not found" },
        { status: 404 }
      );
    }

    // TODO: Verify user owns event

    await deleteBundle(bundleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bundle:", error);
    return NextResponse.json(
      { error: "Failed to delete bundle" },
      { status: 500 }
    );
  }
}
