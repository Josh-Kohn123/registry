import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const locale = requestUrl.pathname.split("/")[1];

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Password reset flow — send to the reset page to enter new password
      if (next === "reset-password") {
        return NextResponse.redirect(
          new URL(`/${locale}/auth/reset-password`, requestUrl.origin)
        );
      }
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
