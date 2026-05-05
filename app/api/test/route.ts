import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  const headerList = await headers();

  // Collect every header sent by IIS
  const allHeaders: Record<string, string> = {};
  headerList.forEach((value, key) => {
    allHeaders[key] = value;
  });

  const diagnostics = {
    // 1. Path Analysis
    internalNextUrl: req.url,
    nextPathName: req.nextUrl.pathname,
    basePathDetected: req.nextUrl.basePath,

    // 2. The Identity Chain
    hostHeader: headerList.get('host'),
    forwardedHost: headerList.get('x-forwarded-host'),
    forwardedProto: headerList.get('x-forwarded-proto'),
    forwardedPrefix: headerList.get('x-forwarded-prefix'),

    // 3. Routing Intelligence
    // IIS often populates these when using URL Rewrite
    xOriginalUrl: headerList.get('x-original-url'),
    xRewriteUrl: headerList.get('x-rewrite-url'),

    // 4. All Headers (For hidden IIS metadata)
    allHeaders,
  };

  console.log('--- ROBUST IIS DIAGNOSTIC ---');
  console.dir(diagnostics, { depth: null });

  return NextResponse.json(diagnostics);
}
