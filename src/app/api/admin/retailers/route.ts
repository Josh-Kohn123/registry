import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 50;

    const where = query
      ? {
          OR: [
            { domain: { contains: query, mode: "insensitive" as const } },
            { name: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [retailers, total] = await Promise.all([
      prisma.retailerWhitelist.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.retailerWhitelist.count({ where }),
    ]);

    return NextResponse.json({ retailers, total, page, limit });
  } catch (error) {
    console.error("Error listing retailers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
