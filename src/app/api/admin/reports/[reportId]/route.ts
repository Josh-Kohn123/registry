import { NextRequest, NextResponse } from "next/server";
import { getReportById, updateReport, createAdminAction } from "@/lib/db";

async function isAdmin(userId?: string): Promise<boolean> {
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }>  }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const report = await getReportById((await params).reportId);
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }>  }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, action } = body;

    const updated = await updateReport((await params).reportId, {
      status,
      resolvedAt: status === "RESOLVED" ? new Date() : undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // If resolving, log the action
    if (status === "RESOLVED" && updated.reportedEventId) {
      await createAdminAction(updated.reportedEventId, {
        eventId: updated.reportedEventId,
        actionType: `resolve_report_${action || "other"}`,
        reason: `Report ${(await params).reportId} resolved`,
        metadata: {},
      });
    }

    return NextResponse.json({
      success: true,
      report: updated,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}
