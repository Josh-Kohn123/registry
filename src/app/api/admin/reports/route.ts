import { NextRequest, NextResponse } from "next/server";
import { reportSchema } from "@/lib/validators";
import { createReport, getAllReports } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

function verifyAdminKey(request: NextRequest): boolean {
  const adminKey = request.headers.get("x-admin-key")
    || request.nextUrl.searchParams.get("admin_key");
  return adminKey === process.env.ADMIN_SECRET_KEY;
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminKey(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const reports = await getAllReports();
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit public reports
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!(await rateLimit(`report_${ip}`, 5, 3600000))) {
      return NextResponse.json(
        { error: "Too many reports from this IP" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = reportSchema.parse(body);

    const report = await createReport({
      reportedEventId: parsed.reportedEventId,
      reporterEmail: parsed.reporterEmail,
      reportType: parsed.reportType,
      description: parsed.description,
      status: "PENDING",
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
    });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 400 }
    );
  }
}
