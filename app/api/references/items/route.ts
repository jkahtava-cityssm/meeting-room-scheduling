import { guardRoute } from '@/lib/api-guard';
import { InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { findManyItems } from '@/lib/data/items';
import { findManyProperties } from '@/lib/data/properties';

import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return guardRoute(
    req,
    {
      AnyOf: [
        { EventReadSelf: { type: 'permission', resource: 'Event', action: 'Read Self' } },
        { EventReadAll: { type: 'permission', resource: 'Event', action: 'Read All' } },
      ],
    },
    async ({ sessionUserId, permissionCache, permissions, sessionId, data }) => {
      const eventItems = await findManyItems();

      if (!eventItems) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage('Collected Items', eventItems);
    },
  );
}
