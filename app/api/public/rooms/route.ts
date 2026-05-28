import { NextRequest } from 'next/server';
import { InternalServerErrorMessage, SuccessMessage, UnauthorizedMessage } from '@/lib/api-helpers';

import { findPublicRooms } from '@/lib/data/public';
import { verifySecretHeader } from '@/lib/server/verifySecretHeader';

export async function GET(request: NextRequest) {
  if (!verifySecretHeader(request)) {
    return UnauthorizedMessage();
  }

  const rooms = await findPublicRooms({ publicFacing: true });

  if (!rooms) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage('Collected Rooms', rooms);
}
