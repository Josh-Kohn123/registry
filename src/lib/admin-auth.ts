import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Verify admin access via x-admin-key header.
 * Falls back to Supabase session + admin_key query param for browser-based admin UI.
 */
export async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const adminKey = request.headers.get("x-admin-key");
  if (adminKey === process.env.ADMIN_SECRET_KEY) return true;

  // Fallback for browser-based admin panel: check Supabase session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const queryKey = request.nextUrl.searchParams.get("admin_key");
  return queryKey === process.env.ADMIN_SECRET_KEY;
}
