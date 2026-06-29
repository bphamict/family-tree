export const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

export const AUTH_ROUTES_ALLOW_AUTHENTICATED = ["/reset-password"] as const;

export const PROTECTED_ROUTE_PREFIXES = ["/dashboard", "/families"] as const;

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function shouldRedirectAuthenticatedFromAuthRoute(
  pathname: string,
): boolean {
  return (
    isAuthRoute(pathname) &&
    !AUTH_ROUTES_ALLOW_AUTHENTICATED.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    )
  );
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
