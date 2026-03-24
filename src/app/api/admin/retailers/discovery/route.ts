import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// GET: List pending discoveries grouped by batch
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const batches = await prisma.discoveryBatch.findMany({
      where: {
        discoveries: { some: { status: "pending" } },
      },
      orderBy: { startedAt: "desc" },
      include: {
        discoveries: {
          where: { status: "pending" },
          orderBy: { score: "desc" },
        },
      },
    });

    return NextResponse.json({ batches });
  } catch (error) {
    console.error("Error fetching discoveries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Submit batch decisions
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const decisions: Array<{ id: string; action: "approve" | "reject" }> = body.decisions;

    if (!Array.isArray(decisions) || decisions.length === 0) {
      return NextResponse.json({ error: "No decisions provided" }, { status: 400 });
    }

    if (decisions.length > 200) {
      return NextResponse.json({ error: "Too many decisions (max 200)" }, { status: 400 });
    }

    const approved: string[] = [];
    const rejected: string[] = [];

    for (const d of decisions) {
      if (d.action === "approve") approved.push(d.id);
      else if (d.action === "reject") rejected.push(d.id);
    }

    // Execute in a transaction
    await prisma.$transaction(async (tx) => {
      // Get approved retailer details
      if (approved.length > 0) {
        const toApprove = await tx.discoveredRetailer.findMany({
          where: { id: { in: approved }, status: "pending" },
        });

        // Create whitelist entries
        for (const retailer of toApprove) {
          await tx.retailerWhitelist.upsert({
            where: { domain: retailer.domain },
            update: { name: retailer.name, isActive: true },
            create: {
              domain: retailer.domain,
              name: retailer.name,
              isActive: true,
            },
          });
        }

        // Mark as approved
        await tx.discoveredRetailer.updateMany({
          where: { id: { in: approved } },
          data: { status: "approved" },
        });
      }

      // Mark rejected
      if (rejected.length > 0) {
        await tx.discoveredRetailer.updateMany({
          where: { id: { in: rejected } },
          data: { status: "rejected", rejectedAt: new Date() },
        });
      }
    });

    return NextResponse.json({
      success: true,
      approved: approved.length,
      rejected: rejected.length,
    });
  } catch (error) {
    console.error("Error processing decisions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
