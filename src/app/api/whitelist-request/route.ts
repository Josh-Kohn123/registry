import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const whitelistRequestSchema = z.object({
  storeName: z.string().min(1).max(200),
  storeUrl: z.string().url(),
  reason: z.string().max(500).optional(),
});

// Developer email address for whitelist requests
const DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL || "developer@simchalist.co.il";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = whitelistRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { storeName, storeUrl, reason } = result.data;

    // Log the request (in production, send email via service like Resend/SendGrid)
    console.log(`[WHITELIST REQUEST] From: ${user.email}`);
    console.log(`  Store: ${storeName}`);
    console.log(`  URL: ${storeUrl}`);
    console.log(`  Reason: ${reason || "N/A"}`);
    console.log(`  -> Send to: ${DEVELOPER_EMAIL}`);

    // If SMTP/email service is configured, send email here
    // For now, log and return success with mailto fallback
    const mailtoSubject = encodeURIComponent(`Whitelist Request: ${storeName}`);
    const mailtoBody = encodeURIComponent(
      `Store Name: ${storeName}\nStore URL: ${storeUrl}\nReason: ${reason || "N/A"}\nRequested by: ${user.email}`
    );
    const mailtoLink = `mailto:${DEVELOPER_EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`;

    return NextResponse.json({
      success: true,
      message: "Request submitted successfully",
      mailtoLink,
    });
  } catch (error) {
    console.error("Whitelist request error:", error);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
