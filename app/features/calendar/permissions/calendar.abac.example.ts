import type { PermissionCache } from "@/lib/auth-permission-checks";
import type { Session } from "@/lib/auth-client";
import type { IEvent } from "@/lib/schemas";
/*
export function canUpdateEvent(cache: PermissionCache | null, session: Session, event: IEvent): boolean {
  if (!cache) return false;
  if (cache.isAdmin) return true;

  // RBAC can still short-circuit:
  if (hasPermission(cache, "Event", "Update")) return true;

  // ABAC: owner can update their own event
  return event.createdByUserId === session.user.id; // adjust field names
}

export function canReadBooking(
  cache: PermissionCache | null,
  session: Session,
  booking: { userId: string },
): boolean {
  if (!cache) return false;
  if (cache.isAdmin) return true;

  if (hasPermission(cache, "User", "Read All")) return true;
  return booking.userId === session.user.id;
}
  */
