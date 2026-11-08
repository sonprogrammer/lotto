import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/features/auth/lib/safe-redirect";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/error", requestUrl.origin));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL("/auth/error", requestUrl.origin));
    }

    const nextPath = getSafeRedirectPath(requestUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
  } catch {
    return NextResponse.redirect(new URL("/auth/error", requestUrl.origin));
  }
}
