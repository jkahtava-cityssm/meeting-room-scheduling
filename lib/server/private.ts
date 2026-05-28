'use server';

import { IRolePermissions } from '../data/permissions';
import { privateServerGET } from '../fetch-server';
import { SessionRole } from '../types';

export async function fetchPrivateCachedUserRole(userId: number, tag: string, impersonatingRole?: SessionRole) {
  return privateServerGET<IRolePermissions[]>(`/api/users/${userId}/roles`, { impersonatingRole }, 300, [tag]);
}
