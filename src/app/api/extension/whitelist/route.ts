import { NextResponse } from "next/server";
import { getWhitelistedDomains, getRetailerName } from "@/lib/retailer-whitelist";

export async function GET() {
  const domains = await getWhitelistedDomains();
  const entries = await Promise.all(
    domains.map(async (domain) => ({
      domain,
      name: await getRetailerName(domain),
    }))
  );
  return NextResponse.json({ domains: entries });
}
