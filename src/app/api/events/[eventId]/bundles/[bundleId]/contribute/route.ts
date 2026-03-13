import { NextRequest, NextResponse } from "next/server";
import { bundleContributeSchema } from "@/lib/validators";
import {
  getBundleById,
  addBundleContribution,
  getTotalBundleContributions,
} from "@/lib/db";

interface RouteParams {
  params: Promise<{
    eventId: string;
    bundleId: string;
  }>;
}

// POST /api/events/[eventId]/bundles/[bundleId]/contribute
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { bundleId } = await params;

    const bundle = await getBundleById(bundleId);
    if (!bundle) {
      return NextResponse.json(
        { error: "Bundle not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = bundleContributeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Record contribution
    const contribution = await addBundleContribution(bundleId, {
      guestName: data.guestName,
      amount: data.amount,
      message: data.message,
    });

    // Get updated total
    const totalContributions = await getTotalBundleContributions(bundleId);

    return NextResponse.json(
      {
        contribution,
        totalContributions,
        targetReached: totalContributions >= bundle.targetAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error recording contribution:", error);
    return NextResponse.json(
      { error: "Failed to record contribution" },
      { status: 500 }
    );
  }
}
