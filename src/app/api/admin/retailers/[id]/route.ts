import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (typeof body.name === "string") updateData.name = body.name;
    if (typeof body.allowedPaths === "string" || body.allowedPaths === null) {
      updateData.allowedPaths = body.allowedPaths;
    }
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const retailer = await prisma.retailerWhitelist.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ retailer });
  } catch (error) {
    console.error("Error updating retailer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
