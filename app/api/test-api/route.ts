import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api-guard';
import { BadRequestMessage } from '@/lib/api-helpers';
import { privateServerGET, privateServerPOST } from '@/lib/fetch-server';

type ProxyRequest = {
  url: string;
  method: 'GET' | 'POST';
  params?: Record<string, string | number | boolean | string[] | undefined>;
  data?: object;
};

export async function POST(request: NextRequest) {
  return guardRoute(
    request,
    {
      EditConfiguration: { type: 'permission', resource: 'Settings', action: 'Edit Configuration' },
    },
    async () => {
      let body: ProxyRequest;

      try {
        body = await request.json();
      } catch {
        return BadRequestMessage('Invalid JSON body');
      }

      if (!body?.url || !body.method) {
        return BadRequestMessage('Missing request metadata');
      }

      const normalizedUrl = body.url.startsWith('/') ? body.url : `/${body.url}`;

      if (body.method === 'GET') {
        const result = await privateServerGET(normalizedUrl, body.params ?? {});
        return NextResponse.json(result.data, { status: result.status });
      }

      if (body.method === 'POST') {
        const result = await privateServerPOST(normalizedUrl, body.data ?? {});
        return NextResponse.json(result.data, { status: result.status });
      }

      return BadRequestMessage('Unsupported proxy method');
    },
  );
}
