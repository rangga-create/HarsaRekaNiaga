import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (pathname === "/" || pathname === "/login") {
    return NextResponse.next();
  }

  // Check for auth token in cookies (Firebase client-side auth handled in UI)
  // Server-side middleware can check for a session cookie if using Firebase Admin
  // For now, allow all routes — client-side handles auth via useAuth()
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/suppliers/:path*", "/buyers/:path*", "/products/:path*", "/commissions/:path*", "/calculator/:path*", "/team/:path*", "/settings/:path*"],
};
