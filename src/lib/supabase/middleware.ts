import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  AUTHENTICATED_HOME,
  isProtectedRoute,
  shouldRedirectAuthenticatedFromAuthRoute,
} from "@/lib/auth/routes";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const env = getPublicEnv();
  const pathname = request.nextUrl.pathname;

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = AUTHENTICATED_HOME;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && shouldRedirectAuthenticatedFromAuthRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = AUTHENTICATED_HOME;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
