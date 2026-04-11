import { guardRoute } from '@/lib/api-guard';
import { CreatedMessage, InternalServerErrorMessage, NotFoundMessage, SuccessMessage } from '@/lib/api-helpers';
import { createUser, findManyUsers, upsertUser } from '@/lib/data/users';
import { SUserPUT } from '@/lib/services/users';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    {
      AnyOf: [
        {
          ReadAll: { type: 'permission', resource: 'User', action: 'Read All' },
          ReadSelf: { type: 'permission', resource: 'User', action: 'Read Self' },
        },
      ],
    },
    async () => {
      const searchParams = request.nextUrl.searchParams;

      const onlyActive = searchParams.get('onlyActive');

      const users = await findManyUsers(onlyActive ? { isActive: true } : undefined);
      if (!users) {
        return NotFoundMessage();
      }

      return SuccessMessage('Collected Users', users);
    },
  );
}

export async function PUT(request: NextRequest) {
  return guardRoute(
    request,

    {
      AnyOf: [
        { EditUsers: { type: 'permission', resource: 'User', action: 'Update' } },
        { EditUsers: { type: 'permission', resource: 'Settings', action: 'Edit Users' } },
      ],
    },
    async ({ sessionUserId, data }) => {
      const updatedUser = await upsertUser(
        {
          userId: data.userId,
          name: data.name,
          email: data.email,
          isActive: data.isActive,
          isManaged: data.isManaged,
          emailEnabled: data.emailEnabled,
          department: data.department,
          jobTitle: data.jobTitle,
          externalId: data.externalId,
        },
        sessionUserId,
      );

      if (!updatedUser) {
        return InternalServerErrorMessage();
      }

      if (updatedUser.userId === data.userId) {
        return SuccessMessage('Updated Event', updatedUser);
      }

      return CreatedMessage('Created Event', updatedUser);
    },
    SUserPUT,
  );
}

export async function POST(request: NextRequest) {
  return guardRoute(
    request,

    {
      AnyOf: [
        { EditUsers: { type: 'permission', resource: 'User', action: 'Create' } },
        { EditUsers: { type: 'permission', resource: 'Settings', action: 'Edit Users' } },
      ],
    },
    async ({ sessionUserId, data }) => {
      const createdUser = await createUser(
        {
          name: data.name,
          email: data.email,
          isActive: data.isActive,
          isManaged: data.isManaged,
          emailEnabled: data.emailEnabled,
          department: data.department,
          jobTitle: data.jobTitle,
          externalId: data.externalId,
        },
        sessionUserId,
      );

      if (!createdUser) {
        return InternalServerErrorMessage();
      }

      return CreatedMessage('Created Event', createdUser);
    },
    SUserPUT,
  );
}
