import { BadRequestMessage, NotFoundMessage, SuccessMessage, UnauthorizedMessage } from '@/lib/api-helpers';
import { getRolesByName, getRolesByUserId } from '@/lib/data/permissions';
import { verifySecretHeader } from '@/lib/server/verifySecretHeader';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  if (!verifySecretHeader(request)) {
    return UnauthorizedMessage();
  }

  const { userId } = await params;

  const { searchParams } = new URL(request.url);
  const impersonatingRole = searchParams.get('impersonatingRole');

  if (!userId) {
    return BadRequestMessage();
  }

  const roles = impersonatingRole ? await getRolesByName(impersonatingRole) : await getRolesByUserId(Number(userId));

  if (!roles) {
    return NotFoundMessage();
  }

  return SuccessMessage('User Roles', roles);
}
