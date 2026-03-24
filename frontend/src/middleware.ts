import { NextRequest, NextResponse } from "next/server";

// Dashboard routes are protected client-side via the useAuth hook in each page.
// This middleware handles URL-level redirects for the /dashboard root path.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redirect bare /dashboard to login — let each role page handle its own auth check
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/"],
};
