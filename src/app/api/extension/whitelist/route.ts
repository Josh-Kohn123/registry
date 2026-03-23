import { NextResponse } from "next/server";
import { RETAILER_WHITELIST } from "@/lib/retailer-whitelist";

export async function GET() {
  return NextResponse.json({
    domains: RETAILER_WHITELIST,
  });
}
