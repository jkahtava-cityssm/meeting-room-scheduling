import { betterFetch } from "@better-fetch/fetch";
import type { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

type Session = typeof auth.$Infer.Session;

export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
    baseURL: request.nextUrl.origin,
    headers: {
      cookie: request.headers.get("cookie") || "", // Forward the cookies from the request
    },
  });

  if (!session) {
    console.log(request.nextUrl.pathname);
    console.log(session);
    //console.log("MIDDLEWARE REDIRECT")
    return NextResponse.redirect(new URL("/?callbackurl=" + request.nextUrl.pathname, request.url));
  }

  //console.log(session)
  return NextResponse.next();
}

export const config = {
  //runtime: "nodejs",
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public/images
     * - $ = index = /
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|$).*)",
  ],
};
