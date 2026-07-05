import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Top-level route segments that require an authenticated session.
// The `(dashboard)` route group and the `/onboarding` route do NOT prefix
// their URLs with the route group folder name (e.g. `(dashboard)/athletes`
// resolves to `/athletes`, not `/dashboard/athletes`), so every protected
// segment is listed explicitly instead of relying on a shared "/dashboard"
// prefix.
//
// Route map applied here:
//   /                    -> public (landing)
//   /login               -> public (auth)
//   /criar-conta         -> public (auth)
//   /esqueci-senha       -> public (auth)
//   /redefinir-senha     -> public (auth, accessed via recovery link)
//   /onboarding          -> protected
//   /dashboard           -> protected
//   /alerts              -> protected
//   /athletes[/:id]      -> protected
//   /competitions[/:id]  -> protected
//   /entities[/:id]      -> protected
//   /funil-esportivo     -> protected
//   /mapa-de-talentos    -> protected
//   /meu-perfil          -> protected
//   /scouting            -> protected
//   /settings            -> protected
//   /atleta/:slug        -> public (public athlete profile)
//   /api/*               -> not covered by this proxy matcher; each route
//                           handler must verify its own auth (see matcher).
const PROTECTED_ROUTES = [
  "/onboarding",
  "/dashboard",
  "/alerts",
  "/athletes",
  "/competitions",
  "/entities",
  "/funil-esportivo",
  "/mapa-de-talentos",
  "/meu-perfil",
  "/scouting",
  "/settings",
];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auth routes that should redirect to dashboard if logged in
  const authRoutes = ["/login", "/criar-conta", "/esqueci-senha"];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Protected routes — see PROTECTED_ROUTES above for the full route map.
  const isProtectedRoute = matchesRoute(
    request.nextUrl.pathname,
    PROTECTED_ROUTES
  );

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Onboarding check — redirect to /onboarding if not complete
  if (
    user &&
    isProtectedRoute &&
    !matchesRoute(request.nextUrl.pathname, ["/onboarding"])
  ) {
    const onboardingComplete = user.user_metadata?.onboarding_complete;
    if (!onboardingComplete) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
