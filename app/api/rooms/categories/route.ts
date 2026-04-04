import { guardRoute } from '@/lib/api-guard';
import { InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { findManyRoomCategories } from '@/lib/data/categories';

import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return guardRoute(
    req,
    { EditRooms: { type: 'permission', resource: 'Settings', action: 'Edit Rooms' } },
    async ({ sessionUserId, permissionCache, permissions, sessionId, data }) => {
      const roomCategories = await findManyRoomCategories();

      if (!roomCategories) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage('Collected Room Categories', roomCategories);
    },
  );
}
