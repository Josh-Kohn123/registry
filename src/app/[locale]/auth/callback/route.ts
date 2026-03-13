import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const locale = requestUrl.pathname.split("/")[1];

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard`, requestUrl.origin)
      );
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    new URL(`/${locale}/auth/error`, requestUrl.origin)
  );
}
