import { betterFetch } from '@better-fetch/fetch';
import type { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

type Session = typeof auth.$Infer.Session;

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  //This is a quick check to redirect users if a cookie isnt present.
  //it is not considered secure, because middleware is not secure.
  //so each page and api route should check for a session regardless
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login/?callbackurl=' + request.nextUrl.pathname, request.url));
  }

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
    //"/((?!^/images$|^/|^/_next/static|^/robots.txt|^/_next/image$|^/_next/static$|^/api/public|^/login$|^/robots.txt$|^/favicon.ico|^/favicon.ico$|^/sitemap.xml$|^/login|^/api/auth$|^/api/auth|^/images|^/api/public$|^/_next/image|^/sitemap.xml).*)",
    //"/((?!^/$|^/login$|^/api|^/_next/static|^/_next/image|^/favicon.ico$|^/sitemap.xml$|^/robots.txt$|^/images).*)",
    '/((?!api|login|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|$).*)',
    //"/((?!^/$|^/login$|^/api/public|^/api/auth|^/_next/static|^/_next/image|^/favicon.ico$|^/sitemap.xml$|^/robots.txt$|^/images).*)",
  ],
};
