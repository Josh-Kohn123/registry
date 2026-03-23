import { NextRequest, NextResponse } from "next/server";
import { getAllAdminActions, getAdminActionsByEvent } from "@/lib/db";

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

    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get("eventId");

    let actions;
    if (eventId) {
      actions = await getAdminActionsByEvent(eventId);
    } else {
      actions = await getAllAdminActions();
    }

    // Sort by newest first
    actions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({
      actions,
      count: actions.length,
    });
  } catch (error) {
    console.error("Error fetching audit log:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit log" },
      { status: 500 }
    );
  }
}
