import { Action, Item, PrismaClient, Resource, ResourceAction, Role } from '@prisma/client';
import {
  CONFIG_MANIFEST,
  DEFAULT_PERMISSION_SETS,
  DEFAULT_RESOURCE_ACTIONS,
  DEFAULT_USER_ROLES,
  SessionAction,
  SessionResource,
  SessionRole,
  SYSTEM_PROCESS_MANIFEST,
  TColors,
  TConfigurationKeys,
  TStatusKey,
  TSystemProcess,
} from '../lib/types';
import { addDays, addYears, differenceInDays, endOfDay, startOfDay } from 'date-fns';
import {
  DOMAINS,
  EVENTDESCRIPTIONS,
  EVENTS,
  FIRST_NAMES,
  LAST_NAMES,
  RECURRENCE_PATTERN,
  RECURRENCE_TYPE,
  TIME_SLOT_INTERVAL_MINUTES,
  VISIBLE_HOUR_END,
  VISIBLE_HOUR_START,
} from './seed-data';
import { ByWeekday, datetime, RRule } from 'rrule';

import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { property } from 'lodash';

type IconName = keyof typeof dynamicIconImports;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // e.g., regular user
    },
  },
});

const prismaAdmin = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_ADMIN, // e.g., user with elevated privileges
    },
  },
});

async function FindCreateActionList() {
  const DEFAULT_ACTIONS = Array.from(new Set(DEFAULT_RESOURCE_ACTIONS.flatMap((r) => r.ACTIONS))) as readonly SessionAction[];

  const actionList: Record<SessionAction, Action> = {} as Record<SessionAction, Action>;

  for (const action of DEFAULT_ACTIONS) {
    actionList[action] = await FindCreateAction(action);
  }

  return actionList;
}

async function FindCreateAction(name: string): Promise<Action> {
  let record = await prisma.action.findFirst({ where: { name: name }, orderBy: { actionId: 'asc' } });

  if (!record) {
    record = await prisma.action.create({ data: { name: name, createdBy: 0, updatedBy: 0 } });
  }

  return record;
}

async function FindCreateRoleList() {
  const roleList: Record<SessionRole, Role> = {} as Record<SessionRole, Role>;

  for (const role of DEFAULT_USER_ROLES) {
    if (role === 'Public' || role === 'Private') continue;

    roleList[role] = await FindCreateRole(role);
  }
  return roleList;
}

async function FindCreateRole(name: string): Promise<Role> {
  let record = await prisma.role.findFirst({ where: { name: name } });

  if (!record) {
    record = await prisma.role.create({ data: { name: name, createdBy: 0, updatedBy: 0 } });
  }

  return record;
}

async function FindCreateResourceList() {
  const DEFAULT_RESOURCES = Array.from(new Set(DEFAULT_RESOURCE_ACTIONS.flatMap((r) => r.RESOURCE))) as readonly SessionResource[];

  const resourceList: Record<SessionResource, Resource> = {} as Record<SessionResource, Resource>;

  for (const resource of DEFAULT_RESOURCES) {
    resourceList[resource] = await FindCreateResource(resource);
  }
  return resourceList;
}

async function FindCreateResource(name: string): Promise<Resource> {
  let record = await prisma.resource.findFirst({ where: { name: name }, orderBy: { resourceId: 'asc' } });

  if (!record) {
    record = await prisma.resource.create({ data: { name: name, createdBy: 0, updatedBy: 0 } });
  }

  return record;
}

async function FindCreateResourceActionList(resourceList: Record<SessionResource, Resource>, actionList: Record<SessionAction, Action>) {
  const resourceActionList: Record<string, Record<string, ResourceAction>> = {} as Record<string, Record<string, ResourceAction>>;

  for (const resourceAction of DEFAULT_RESOURCE_ACTIONS) {
    const resourceId = resourceList[resourceAction.RESOURCE].resourceId;
    resourceActionList[resourceAction.RESOURCE] = {};

    for (const actionName of resourceAction.ACTIONS) {
      const actionId = actionList[actionName].actionId;
      resourceActionList[resourceAction.RESOURCE][actionName] = await FindCreateResourceActionRecord(resourceId, actionId);
    }
  }
  return resourceActionList;
}

async function FindCreateResourceActionRecord(resourceId: number, actionId: number): Promise<ResourceAction> {
  let record = await prisma.resourceAction.findFirst({
    where: { resourceId: resourceId, actionId: actionId },
  });

  if (!record) {
    record = await prisma.resourceAction.create({
      data: { resourceId: resourceId, actionId: actionId, createdBy: 0, updatedBy: 0 },
    });
  }

  return record;
}

async function FindCreateRoleResourceAction(roleId: number, resourceActionId: number, permit: boolean) {
  let record = await prisma.roleResourceAction.findFirst({
    where: { roleId: roleId, resourceActionId: resourceActionId },
    orderBy: { roleResourceActionId: 'asc' },
  });

  if (!record) {
    record = await prisma.roleResourceAction.create({
      data: { roleId: roleId, resourceActionId: resourceActionId, permit: permit, createdBy: 0, updatedBy: 0 },
    });
  }

  return record;
}

async function FindCreatePermissionSet(role: Role, resourceAction: ResourceAction) {
  const roleResourceAction = await FindCreateRoleResourceAction(role.roleId, resourceAction.resourceActionId, true);

  return {
    roleResourceAction,
  };
}

const getRandom = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

async function CreateRandomUsers(count: number) {
  const createdUsers = [];

  for (let i = 0; i < count; i++) {
    const firstName = getRandom(FIRST_NAMES);
    const lastName = getRandom(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;

    // Create a semi-unique email by appending a random number
    const randomID = Math.floor(Math.random() * 10000);
    const email = `${firstName}.${lastName}${randomID}@${getRandom(DOMAINS)}`;

    const user = await findCreateUser({
      name: fullName,
      email: email,

      employeeNumber: Math.floor(10000 + Math.random() * 90000).toString(),
      emailVerified: Math.random() > 0.5,
      employeeActive: true,
    });

    createdUsers.push(user);
  }

  return createdUsers;
}
async function findCreateUser(userData: {
  email: string;
  name: string;
  employeeNumber: string;
  emailVerified?: boolean;
  image?: string | null;
  employeeActive?: boolean;
}) {
  return await prisma.user.upsert({
    where: { email: userData.email },
    update: {}, // Leave empty to avoid overwriting existing test data
    create: {
      name: userData.name,
      email: userData.email,
      emailVerified: userData.emailVerified ?? false,
      image: userData.image ?? null,
      externalId: userData.employeeNumber,
      isActive: userData.employeeActive ?? true,
      createdBy: 0,
      updatedBy: 0,
    },
  });
}

async function FindCreateUserRole(roleId: number, userId: number) {
  let record = await prisma.userRole.findFirst({
    where: { roleId: roleId, userId: userId },
  });

  if (!record) {
    record = await prisma.userRole.create({
      data: { roleId: roleId, userId: userId, createdBy: 0, updatedBy: 0 },
    });
  }

  return record;
}

async function FindCreateConfigurationSetting(key: TConfigurationKeys, name: string, description: string, value: string, type: string) {
  let record = await prisma.configuration.findFirst({
    where: { key: key },
  });

  if (!record) {
    record = await prisma.configuration.create({
      data: { key: key, name: name, description: description, value: value, type: type, createdBy: 0, updatedBy: 0 },
    });
  }
  return record;
}

async function FindCreateRoomCategory(name: string) {
  let record = await prisma.roomCategory.findFirst({
    where: { name: name },
    orderBy: { roomCategoryId: 'asc' },
  });

  if (!record) {
    record = await prisma.roomCategory.create({
      data: { name: name, createdBy: 0, updatedBy: 0 },
    });
  }
  return record;
}

async function FindCreateRoomProperty(roomId: number, propertyId: number, value: string) {
  return await prisma.roomProperty.upsert({
    where: {
      roomId_propertyId: {
        roomId: roomId,
        propertyId: propertyId,
      },
    },
    update: {
      value: value,
      updatedBy: 0,
    },
    create: {
      roomId: roomId,
      propertyId: propertyId,
      value: value,
      createdBy: 0,
      updatedBy: 0,
    },
  });
}

async function FindCreateProperty(name: string, type: string) {
  return await prisma.property.upsert({
    where: {
      name: name,
    },
    update: {
      name: name,
      type: type,
      createdBy: 0,
      updatedBy: 0,
    },
    create: {
      name: name,
      type: type,
      createdBy: 0,
      updatedBy: 0,
    },
  });
}

async function FindCreateItem(name: string): Promise<Item> {
  let record = await prisma.item.findFirst({ where: { name: name }, orderBy: { itemId: 'asc' } });

  if (!record) {
    record = await prisma.item.create({ data: { name: name, createdBy: 0, updatedBy: 0 } });
  }

  return record;
}

async function FindCreateRooms(
  name: string,
  color: TColors,
  icon: IconName,
  roomCategoryId: number = 1,
  isPublicFacing: boolean = false,
  roomRoleId?: number[],
  displayOrder?: number,
) {
  let record = await prisma.room.findFirst({
    where: { name: name },
  });

  if (!record) {
    record = await prisma.room.create({
      data: {
        name: name,
        color: color,
        icon: icon,
        roomCategoryId: roomCategoryId,
        publicFacing: isPublicFacing,
        displayOrder: displayOrder,
        createdBy: 0,
        updatedBy: 0,
      },
    });
  }

  if (roomRoleId) {
    for (const roleId of roomRoleId) {
      let roomRole = await prisma.roomRole.findFirst({ where: { roomId: record!.roomId, roleId: roleId } });

      if (!roomRole) {
        roomRole = await prisma.roomRole.create({
          data: { roomId: record!.roomId, roleId: roleId, createdBy: 0, updatedBy: 0 },
        });
      }
    }
  }
  return record;
}

async function FindCreateEventStatus(name: string, icon: IconName, color: TColors, key: TStatusKey) {
  let record = await prisma.status.findFirst({
    where: { name: name },
  });

  if (!record) {
    record = await prisma.status.create({
      data: { name: name, icon: icon, color: color, key: key, createdBy: 0, updatedBy: 0 },
    });
  }
  return record;
}

async function getActiveEventStatus(key: TStatusKey): Promise<{ statusId: number }> {
  const result = await prisma.status.findFirstOrThrow({
    where: { key: key },
    select: { statusId: true },
    orderBy: { statusId: 'asc' },
  });

  return result;
}

function getRandomDescription(): string {
  const numberOfLines = Math.floor(Math.random() * EVENTDESCRIPTIONS.length);
  let newDescription = '';
  for (let index = 0; index <= numberOfLines; index++) {
    newDescription += EVENTDESCRIPTIONS[index] + '\n';
  }
  return newDescription;
}

async function getActiveUsers(): Promise<{ id: number }[]> {
  const result = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true },
    orderBy: { id: 'asc' },
  });

  return result;
}

function validateTimeSlotInterval(interval: number): number {
  const validDivisors = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60];

  if (!validDivisors.includes(interval)) {
    console.warn(`Invalid timeSlotInterval: ${interval}. Must be a positive divisor of 60. Defaulting to 1.`);
    return 1;
  }

  return interval;
}

function validateVisibleHours(visibleHoursStart: number, visibleHoursEnd: number) {
  if (visibleHoursStart >= visibleHoursEnd || visibleHoursStart < 0 || visibleHoursEnd > 25) {
    console.warn(
      `Invalid visible hour range: start=${visibleHoursStart}, end=${visibleHoursEnd}. ` +
        `Start Hour must be less than End Hour, start >= 0, and end < 25. Defaulting to start=0 and end=24.`,
    );
    visibleHoursStart = 0;
    visibleHoursEnd = 24;
  }

  return { visibleHoursStart, visibleHoursEnd };
}

async function FindCreateEventRecipients(userId: number, eventId: number) {
  return await prisma.eventRecipient.upsert({
    where: {
      eventId_userId: {
        userId: userId,
        eventId: eventId,
      },
    },
    update: {},
    create: {
      userId: userId,
      eventId: eventId,
      createdBy: 0,
      updatedBy: 0,
    },
  });
}

async function CreateRandomEvents(
  rooms: {
    name: string;
    createdAt: Date;
    updatedAt: Date;
    roomId: number;
    color: string;
    icon: string | null;
  }[],
  maxEvents: number,
  visibleHoursStart: number = 8,
  visibleHoursEnd: number = 8,
  timeSlotInterval: number = 15,
  maxRangeInDays: number = 30,
  generateAfterDate: Date = new Date(),
  createOnlyRecurring: boolean = false,
) {
  timeSlotInterval = validateTimeSlotInterval(timeSlotInterval);

  const validated = validateVisibleHours(visibleHoursStart, visibleHoursEnd);
  visibleHoursStart = validated.visibleHoursStart;
  visibleHoursEnd = validated.visibleHoursEnd;

  // Date range: maxRangeInDays days before and after Now()
  const startRange = addDays(generateAfterDate, maxRangeInDays);
  const endRange = addDays(generateAfterDate, -maxRangeInDays);

  const userList = await getActiveUsers();
  const { statusId: pendingStatusId } = await getActiveEventStatus('PENDING');

  const intervalsInHour = 60 / timeSlotInterval;
  const hourInterval = visibleHoursEnd - visibleHoursStart;

  for (let index = 0; index < maxEvents; index++) {
    // Determine if this is a multi-day event (10% chance)
    const isMultiDay = createOnlyRecurring ? 0 : Math.random() < 0.1;

    const startDate = new Date(startRange.getTime() + Math.random() * (endRange.getTime() - startRange.getTime()));

    // Determine how many intervals fit in an hour

    // Set time between 8 AM and 8 PM
    startDate.setHours(
      Math.floor(Math.random() * hourInterval) + visibleHoursStart,
      Math.floor(Math.random() * intervalsInHour) * timeSlotInterval,
      0,
      0,
    );

    const endDate = new Date(startDate);

    if (isMultiDay) {
      // Multi-day event: Add 1-12 days
      const additionalDays = Math.floor(Math.random() * 12) + 1;
      endDate.setDate(startDate.getDate() + additionalDays);

      // Set time between 8 AM and 8 PM
      endDate.setHours(
        Math.floor(Math.random() * hourInterval) + visibleHoursStart,
        Math.floor(Math.random() * intervalsInHour) * timeSlotInterval,
        0,
        0,
      );
    } else {
      const minDuration = 30;
      const maxDuration = 180;

      // Calculate how many intervals fit within the min and max bounds
      const minSlots = Math.ceil(minDuration / timeSlotInterval);
      const maxSlots = Math.floor(maxDuration / timeSlotInterval);

      // Pick a random number of slots within that range
      const slotCount = Math.floor(Math.random() * (maxSlots - minSlots + 1)) + minSlots;

      // Final duration in minutes
      const durationMinutes = slotCount * timeSlotInterval;

      endDate.setTime(endDate.getTime() + durationMinutes * 60 * 1000);
    }
    const eventIndex = Math.floor(Math.random() * EVENTS.length);
    const userIndex = Math.floor(Math.random() * userList.length);

    //Check that Dates are within the visible hour window

    if (endDate.getHours() >= visibleHoursEnd) {
      if (startDate.getHours() === endDate.getHours()) {
        startDate.setHours(startDate.getHours() - 1, 30);
      }
      endDate.setHours(visibleHoursEnd, 0);
    }

    const randomRoomCount = Math.floor(Math.random() * rooms.length);
    const isMultiRoom = Math.random() < 0.1;

    const event = await prisma.event.create({
      data: {
        eventRooms: {
          create: [...generateRandomRoomList(rooms, randomRoomCount, isMultiRoom)],
        },
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        title: EVENTS[eventIndex],
        description: getRandomDescription(),
        recurrenceId: await CreateRandomRecurrence(startDate, endDate, createOnlyRecurring),
        statusId: pendingStatusId,
        userId: userList[userIndex].id,
        createdAt: startDate.toISOString(),
        updatedAt: startDate.toISOString(),
        createdBy: 0,
        updatedBy: 0,
      },
    });

    const hasRecipients = Math.random() < 0.25;

    if (hasRecipients) {
      const totalRecipients = Math.floor(Math.random() * 5) + 1;

      const recipientList = userList
        .filter((_, index) => index !== userIndex) // Remove the current user
        .sort(() => Math.random() - 0.5) // Simple shuffle (Fisher-Yates is better for large lists)
        .slice(0, totalRecipients) // Take only what you need
        .map((u) => u.id); // Grab the IDs

      recipientList.map(async (userId) => await FindCreateEventRecipients(userId, event.eventId));
    }
  }
}

/**
 * Finds the next N DST transitions from a given date by detecting timezone offset changes.
 * Works with any timezone - detects transitions automatically.
 * Returns array of objects with transition date and UTC offset change information.
 */
function findNextDSTTransitions(fromDate: Date, yearsToSearch: number = 2) {
  const transitions: Array<{
    date: Date;
    direction: 'forward' | 'backward';
    offsetBefore: number;
    offsetAfter: number;
    offsetChangeMinutes: number;
  }> = [];

  const searchDate = new Date(fromDate);
  searchDate.setHours(0, 0, 0, 0);

  // Search up to 2 years in the future to find transitions
  const endSearch = new Date(searchDate);
  endSearch.setFullYear(endSearch.getFullYear() + yearsToSearch);

  let currentDate = new Date(searchDate);
  while (currentDate < endSearch) {
    const offset1 = currentDate.getTimezoneOffset();

    // Check 1 day ahead
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const offset2 = nextDay.getTimezoneOffset();

    // DST transition detected when UTC offset changes
    if (offset1 !== offset2) {
      const offsetChange = offset1 - offset2; // positive = spring forward, negative = fall back
      transitions.push({
        date: currentDate,
        direction: offsetChange > 0 ? 'forward' : 'backward',
        offsetBefore: offset1,
        offsetAfter: offset2,
        offsetChangeMinutes: Math.abs(offsetChange),
      });
      // Skip ahead to avoid detecting the same transition multiple times
      currentDate = new Date(nextDay);
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      currentDate = new Date(nextDay);
    }
  }

  return transitions;
}

/**
 * Creates edge case multi-day events for testing the refactored multi-day event logic.
 * Tests scenarios like:
 * - Events ending at midnight
 * - Events crossing midnight at various times
 * - Events spanning multiple days
 * - Events with minimal durations crossing day boundaries
 * - Events crossing DST transitions (timezone-aware, generic for any timezone)
 */
async function CreateEdgeCaseMultiDayEvents(
  rooms: {
    name: string;
    createdAt: Date;
    updatedAt: Date;
    roomId: number;
    color: string;
    icon: string | null;
  }[],
) {
  const userList = await getActiveUsers();
  const { statusId: pendingStatusId } = await getActiveEventStatus('PENDING');
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate()); // Start 10 days in the future
  baseDate.setHours(0, 0, 0, 0); // Start at midnight

  // Standard midnight-crossing edge cases
  const midnightEdgeCases = [
    {
      name: '11PM to 1AM (2 hour duration, crosses midnight)',
      description: 'Event starts late evening and ends after midnight',
      startTime: { hours: 23, minutes: 0 },
      endTime: { hours: 1, minutes: 0 },
      dayOffset: 1,
    },
    {
      name: '11PM to 12AM (1 hour, ends at midnight)',
      description: 'Event ends exactly at midnight - edge case that should display as previous day ending',
      startTime: { hours: 23, minutes: 0 },
      endTime: { hours: 0, minutes: 0 },
      dayOffset: 1,
    },
    {
      name: '12AM to 7PM (19 hour duration, starts at midnight)',
      description: 'Event starts at midnight and spans most of the day',
      startTime: { hours: 0, minutes: 0 },
      endTime: { hours: 19, minutes: 0 },
      dayOffset: 0,
    },
    {
      name: '12AM to 12:15AM (15 minutes, crosses midnight)',
      description: 'Minimal duration event crossing midnight',
      startTime: { hours: 0, minutes: 0 },
      endTime: { hours: 0, minutes: 15 },
      dayOffset: 0,
    },
    {
      name: '11:45PM to 12:15AM (30 minutes, crosses midnight)',
      description: 'Short event crossing midnight boundary',
      startTime: { hours: 23, minutes: 45 },
      endTime: { hours: 0, minutes: 15 },
      dayOffset: 1,
    },
    {
      name: '2-day span (12AM to 6PM on day 2)',
      description: 'Multi-day event spanning exactly 2 calendar days',
      startTime: { hours: 0, minutes: 0 },
      endTime: { hours: 18, minutes: 0 },
      dayOffset: 1,
    },
    {
      name: '14-day span (8AM to 4PM on day 14)',
      description: 'Long multi-day event spanning 14 calendar days',
      startTime: { hours: 8, minutes: 0 },
      endTime: { hours: 16, minutes: 0 },
      dayOffset: 13,
    },
    {
      name: '3-day span ending at midnight',
      description: 'Multi-day event that ends exactly at midnight on day 3',
      startTime: { hours: 9, minutes: 0 },
      endTime: { hours: 0, minutes: 0 },
      dayOffset: 2,
    },
    {
      name: '11:30PM to 2:30AM (3 hours, midnight transition)',
      description: 'Longer event crossing midnight',
      startTime: { hours: 23, minutes: 30 },
      endTime: { hours: 2, minutes: 30 },
      dayOffset: 1,
    },
    {
      name: '5-day all-day event (12AM to 12AM)',
      description: 'All-day event spanning 5 days, ending at midnight',
      startTime: { hours: 0, minutes: 0 },
      endTime: { hours: 0, minutes: 0 },
      dayOffset: 4,
    },
    {
      name: '10:45PM to 11:15PM next day (25 hour duration)',
      description: 'Event spanning almost full day crossing midnight',
      startTime: { hours: 22, minutes: 45 },
      endTime: { hours: 23, minutes: 15 },
      dayOffset: 1,
    },
    {
      name: '1AM to 11:59PM (almost full day)',
      description: 'Event nearly spanning a full day, ending just before midnight',
      startTime: { hours: 1, minutes: 0 },
      endTime: { hours: 23, minutes: 59 },
      dayOffset: 0,
    },
  ];

  console.log('\n=== MIDNIGHT EDGE CASES ===');
  for (const edgeCase of midnightEdgeCases) {
    const startDate = new Date(baseDate);
    const endDate = new Date(baseDate);

    // Set start time
    startDate.setHours(edgeCase.startTime.hours, edgeCase.startTime.minutes, 0, 0);

    // Set end time with day offset
    endDate.setDate(endDate.getDate() + edgeCase.dayOffset);
    endDate.setHours(edgeCase.endTime.hours, edgeCase.endTime.minutes, 0, 0);

    const userIndex = Math.floor(Math.random() * userList.length);
    const roomIndex = Math.floor(Math.random() * rooms.length);

    const randomRoomCount = Math.floor(Math.random() * rooms.length);
    const isMultiRoom = Math.random() < 0.1;

    try {
      const event = await prisma.event.create({
        data: {
          eventRooms: {
            create: [...generateRandomRoomList(rooms, randomRoomCount, isMultiRoom)],
          },
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          title: edgeCase.name,
          description: edgeCase.description,
          recurrenceId: null,
          statusId: pendingStatusId,
          userId: userList[userIndex].id,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 0,
          updatedBy: 0,
        },
      });

      console.log(`Created edge case: "${edgeCase.name}"`);
    } catch (error) {
      console.error(`Failed to create edge case "${edgeCase.name}":`, error);
    }
  }

  // Find and test DST transitions
  console.log('\n=== DETECTING DST TRANSITIONS ===');
  const dstTransitions = findNextDSTTransitions(addYears(baseDate, -2), 4);

  if (dstTransitions.length === 0) {
    console.log('No DST transitions found in the next 2 years for this timezone');
  } else {
    for (const transition of dstTransitions) {
      const transitionDate = new Date(transition.date);
      const offsetLabel =
        transition.direction === 'forward' ? `Spring Forward (UTC${transition.offsetAfter / 60}h)` : `Fall Back (UTC${transition.offsetAfter / 60}h)`;

      console.log(`\nDST Transition: ${offsetLabel}`);
      console.log(`   Date: ${transitionDate.toLocaleDateString()} (${transitionDate.toLocaleDateString('en-US', { weekday: 'long' })})`);
      console.log(`   Offset change: ${transition.offsetChangeMinutes} minutes`);

      // Create DST-specific edge case events
      const dstEdgeCases = [
        {
          name: `Event spanning DST transition (1 day before to 1 day after)`,
          description: `Multi-day event crossing the ${transition.direction === 'forward' ? 'spring forward' : 'fall back'} DST transition`,
          daysBeforeTransition: 1,
          daysAfterTransition: 1,
          startHour: 10,
          endHour: 14,
        },
        {
          name: `Event on DST transition day (12AM to 11PM)`,
          description: `Full day event on the exact DST transition day`,
          daysBeforeTransition: 0,
          daysAfterTransition: 0,
          startHour: 0,
          endHour: 23,
        },
        {
          name: `Event ending at 2AM on DST transition (spring forward)`,
          description: `Event that ends around the 2AM transition time during spring forward`,
          daysBeforeTransition: 0,
          daysAfterTransition: 0,
          startHour: 23,
          endHour: 2,
        },
        {
          name: `Event crossing DST boundary (8PM to 9AM next day)`,
          description: `Evening through morning event crossing DST transition`,
          daysBeforeTransition: 0,
          daysAfterTransition: 1,
          startHour: 20,
          endHour: 9,
        },
      ];

      for (const dstCase of dstEdgeCases) {
        const startDate = new Date(transition.date);
        startDate.setDate(startDate.getDate() - dstCase.daysBeforeTransition);
        startDate.setHours(dstCase.startHour, 0, 0, 0);

        const endDate = new Date(transition.date);
        endDate.setDate(endDate.getDate() + dstCase.daysAfterTransition);
        endDate.setHours(dstCase.endHour, 0, 0, 0);

        // Adjust for day wraparound if endHour is less than startHour
        if (dstCase.daysAfterTransition === 0 && dstCase.endHour < dstCase.startHour) {
          endDate.setDate(endDate.getDate() + 1);
        }

        const userIndex = Math.floor(Math.random() * userList.length);
        const roomIndex = Math.floor(Math.random() * rooms.length);

        const randomRoomCount = Math.floor(Math.random() * rooms.length);
        const isMultiRoom = Math.random() < 0.1;

        try {
          const event = await prisma.event.create({
            data: {
              eventRooms: {
                create: [...generateRandomRoomList(rooms, randomRoomCount, isMultiRoom)],
              },
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              title: dstCase.name,
              description: dstCase.description,
              recurrenceId: null,
              statusId: pendingStatusId,
              userId: userList[userIndex].id,
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: 0,
              updatedBy: 0,
            },
          });

          console.log(`Created DST test: "${dstCase.name}"`);
        } catch (error) {
          console.error(`Failed to create DST test "${dstCase.name}":`, error);
        }
      }
    }
  }

  console.log(`\nCompleted creating edge case multi-day events for testing.`);
}

function generateRandomRoomList(
  rooms: {
    name: string;
    createdAt: Date;
    updatedAt: Date;
    roomId: number;
    color: string;
    icon: string | null;
  }[],
  total: number,
  isMultiRoom: boolean,
) {
  const selectedRooms = new Set<number>();

  if (isMultiRoom) {
    while (selectedRooms.size < total) {
      const randomIndex = Math.floor(Math.random() * rooms.length);
      selectedRooms.add(rooms[randomIndex].roomId);
    }
  } else {
    const roomIndex = Math.floor(Math.random() * rooms.length);
    selectedRooms.add(rooms[roomIndex].roomId);
  }

  return Array.from(selectedRooms).map((id) => ({
    roomId: id,
    createdBy: 0,
    updatedBy: 0,
  }));
}

function randomToggle(chance: '75' | '50' | '25' | '10') {
  switch (chance) {
    case '75':
      return Math.random() < 0.75;
      break;
    case '50':
      return Math.random() < 0.5;
      break;
    case '25':
      return Math.random() < 0.25;
      break;
    case '10':
    default:
      return Math.random() < 0.1;
      break;
  }
}

async function CreateRandomRecurrence(startDate: Date, endDate: Date, createOnlyRecurring: boolean = false) {
  //IGNORE MULTI DAY EVENTS WE DONT WANT MULTI DAY RECURRING EVENTS
  if (differenceInDays(endOfDay(endDate), startOfDay(startDate)) >= 1) {
    return undefined;
  }

  const TypeValue = createOnlyRecurring ? 'Occurrences' : RECURRENCE_TYPE[Math.floor(Math.random() * RECURRENCE_TYPE.length)];
  const PatternValue = RECURRENCE_PATTERN[Math.floor(Math.random() * RECURRENCE_PATTERN.length)];

  const occurrences = Math.floor(Math.random() * 100) + 1;

  let interval = 0;
  let dayValue = 0;
  let monthValue = 0;

  const maxPossibleDay: number[] = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const weekdayArray: ByWeekday[] = [];

  switch (PatternValue) {
    case 'Every X Days':
      //PeriodValue = "Daily";
      interval = Math.floor(Math.random() * 7) + 1;
      break;
    case 'Every Weekday':
      //PeriodValue = "Daily";
      interval = 1;
      weekdayArray.push(RRule.MO);
      weekdayArray.push(RRule.TU);
      weekdayArray.push(RRule.WE);
      weekdayArray.push(RRule.TH);
      weekdayArray.push(RRule.FR);
      break;
    case 'Every X Weeks':
      //PeriodValue = "Weekly";
      interval = Math.floor(Math.random() * 7) + 1;
      break;
    case 'Every X Weeks on Every Selected Day':
      //PeriodValue = "Weekly";
      interval = Math.floor(Math.random() * 7) + 1;

      if (randomToggle('25')) weekdayArray.push(RRule.MO);
      if (randomToggle('25')) weekdayArray.push(RRule.TU);
      if (randomToggle('25')) weekdayArray.push(RRule.WE);
      if (randomToggle('25')) weekdayArray.push(RRule.TH);
      if (randomToggle('25')) weekdayArray.push(RRule.FR);
      if (randomToggle('25')) weekdayArray.push(RRule.SA);
      if (randomToggle('25')) weekdayArray.push(RRule.SU);

      if (weekdayArray.length === 0) weekdayArray.push(RRule.TU);

      break;
    case 'Every X Months on X Day':
      //PeriodValue = "Monthly";
      interval = Math.floor(Math.random() * 12) + 1;
      dayValue = Math.floor(Math.random() * 31) + 1;

      break;
    case 'Every X Year on X Month on X Day':
      //PeriodValue = "Yearly";
      interval = Math.floor(Math.random() * 5) + 1;

      monthValue = Math.floor(Math.random() * 12) + 1;
      dayValue = Math.floor(Math.random() * maxPossibleDay[monthValue - 1]) + 1;

      break;
    default:
      //PeriodValue = "Daily";
      interval = Math.floor(Math.random() * 100) + 1;
      dayValue = Math.floor(Math.random() * 7) + 1;
      break;
  }

  const newStartDate = startDate; //addDays(startDate, -Math.floor(Math.random() * 31));

  let newRule = undefined;

  if (TypeValue === 'Occurrences') {
    switch (PatternValue) {
      case 'Every X Days':
        newRule = new RRule({
          freq: RRule.DAILY,
          interval: interval,
          byweekday: weekdayArray,
          dtstart: convertDateToRRuleDate(startDate),
          count: occurrences,
          until: null,
        });
        break;
      case 'Every Weekday':
        newRule = new RRule({
          freq: RRule.DAILY,
          interval: interval,
          byweekday: weekdayArray,
          dtstart: convertDateToRRuleDate(startDate),
          count: occurrences,
          until: null,
        });
        break;
      case 'Every X Weeks':
        newRule = new RRule({
          freq: RRule.WEEKLY,
          interval: interval,
          byweekday: weekdayArray,
          dtstart: convertDateToRRuleDate(startDate),
          count: occurrences,
          until: null,
        });
      case 'Every X Weeks on Every Selected Day':
        newRule = new RRule({
          freq: RRule.WEEKLY,
          interval: interval,
          byweekday: weekdayArray,
          dtstart: convertDateToRRuleDate(startDate),
          count: occurrences,
          until: null,
        });
        break;
      case 'Every X Months on X Day':
        newRule = new RRule({
          freq: RRule.MONTHLY,
          interval: interval,
          dtstart: convertDateToRRuleDate(startDate),
          bymonthday: dayValue,
          count: occurrences,
          until: null,
        });
        break;
      case 'Every X Year on X Month on X Day':
        newRule = new RRule({
          freq: RRule.YEARLY,
          interval: interval,
          dtstart: convertDateToRRuleDate(startDate),
          bymonth: monthValue,
          bymonthday: dayValue,
          count: occurrences,
          until: null,
        });
        break;
    }
  } else if (TypeValue === 'Between') {
  }

  if (!newRule) {
    return null;
  }

  //parseISO(newRule.all().at(0)?.toISOString());
  const newEndDate = newRule.all().at(-1); //parseISO(newRule.all().at(-1)?.toISOString());
  const firstStartDate = newRule.all().at(0);

  if (!newEndDate || !firstStartDate) {
    return null;
  }

  const recurrence = await prisma.recurrence.create({
    data: {
      rule: newRule.toString(),
      startDate: firstStartDate,
      endDate: newEndDate, //newRule.all().at(-1) ?? "",
      description: newRule.toText() ?? '',
      createdBy: 0,
      updatedBy: 0,
    },
  });

  return recurrence.recurrenceId;
}

export function convertDateToRRuleDate(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
}

async function createLinkedServer() {
  await prismaAdmin.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS postgres_fdw;`);

  await prismaAdmin.$executeRawUnsafe(`CREATE SERVER IF NOT EXISTS ${process.env.LINKED_SERVER_NAME}
                                                  FOREIGN DATA WRAPPER postgres_fdw
                                                  OPTIONS (
                                                      host '${process.env.DATABASE_HOST}',
                                                      dbname '${process.env.LINKED_DATABASE_NAME}',
                                                      port '${process.env.DATABASE_PORT}'
                                                  );`);
  await prismaAdmin.$executeRawUnsafe(`CREATE USER MAPPING IF NOT EXISTS FOR ${process.env.DATABASE_USER_USERNAME}
                                                  SERVER ${process.env.LINKED_SERVER_NAME}
                                                  OPTIONS (
                                                      user '${process.env.LINKED_USERNAME}',
                                                      password '${process.env.LINKED_PASSWORD}'
                                                  );`);

  await prismaAdmin.$executeRawUnsafe(`CREATE FOREIGN TABLE IF NOT EXISTS public.avanti_z_ex_emp_pers (
                                                    employee_number text,
                                                    first_name text,
                                                    last_name text,
                                                    work_email text,
                                                    avanti_user_id text
                                                  )
                                                  SERVER ${process.env.LINKED_SERVER_NAME}
                                                  OPTIONS (schema_name 'public', table_name 'avanti_z_ex_emp_pers');`);

  await prismaAdmin.$executeRawUnsafe(`CREATE FOREIGN TABLE IF NOT EXISTS public.avanti_z_ex_emp_data (
                                                    employee_number text,
                                                    location_description text,
                                                    active text
                                                  )
                                                  SERVER ${process.env.LINKED_SERVER_NAME}
                                                  OPTIONS (schema_name 'public', table_name 'avanti_z_ex_emp_data');`);

  await prismaAdmin.$executeRawUnsafe(`GRANT USAGE ON FOREIGN SERVER ${process.env.LINKED_SERVER_NAME} TO ${process.env.DATABASE_USER_USERNAME};`);
  await prismaAdmin.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO ${process.env.DATABASE_USER_USERNAME};`);
  await prismaAdmin.$executeRawUnsafe(`GRANT SELECT ON TABLE public.avanti_z_ex_emp_pers TO ${process.env.DATABASE_USER_USERNAME};`);
  await prismaAdmin.$executeRawUnsafe(`GRANT SELECT ON TABLE public.avanti_z_ex_emp_data TO ${process.env.DATABASE_USER_USERNAME};`);

  await prismaAdmin.$executeRawUnsafe(
    `CREATE OR REPLACE PROCEDURE public.insert_avanti_users()
    LANGUAGE 'sql'
    AS $BODY$
    INSERT INTO public.user
    (name, email, image, external_id,department,is_active,created_at, updated_at)
    SELECT employee_full_name,
        work_email,
        image,
        employee_number,
		    location_description,
        employee_active,
        created_at,
        updated_at
    FROM
    (
    SELECT 	employee_full_name,
        work_email,
        image,
        employee_number,
		location_description,
        created_at,
        updated_at,
        CASE WHEN active = 'Yes' THEN true ELSE false END AS employee_active,
        ROW_NUMBER() OVER (PARTITION BY work_email ORDER BY employee_full_name,active DESC) AS RANK
    FROM
    (
      SELECT  INITCAP(avanti_z_ex_emp_pers.last_name) || ', ' || INITCAP(avanti_z_ex_emp_pers.first_name) AS employee_full_name,
        CASE WHEN lower(avanti_z_ex_emp_pers.avanti_user_id) || '@cityssm.on.ca' <> avanti_z_ex_emp_pers.work_email THEN lower(avanti_z_ex_emp_pers.avanti_user_id) || '@cityssm.on.ca'
        ELSE avanti_z_ex_emp_pers.work_email
        END AS work_email,
        'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAADzUlEQVR4AXyVPYiVRxSG37PZYCBokBQmmgSScquAgS2EJEUICVmygTVN4oakCiSghfiD1gqCFv6ChRaua2XhxdVCBbGwELxgZangD2ghyG4jqIzPe2a+6yf+DHPmvHPmPe+Zme9+3x0L0XLAv6u/kxOKXm4fjxUv5GDwmn1MZCMJCyq6J8UzSTbjBeIbmcMpLIOyE01fh7HqPL66QGQX9hDbT/1f8Guk8h7eBpZj+5mbsyuzc4BFsPZQr0CpxwxNSLoOdwcesRiAZ8FfYe9j4xi4zBZpAIajHeDrHIPcIviE3Uu/QFaegHSBpbXYEOb3+N+wk9htzNfzHG/smNfMGSLqHOdOFAhdrw85Z1CkE0AffwBpkmJXmOP0Bx4cT/BPKAzOGFMZT8IfKORcaziOhfpX5Dv3LoaSZjDvFFf2MsyT/C1nXAZeRkVwzLOlvcQJ6Tl4hrhz14KtRZwrorIg8UvQNtW2GdfEc5eeo63/pVghyQbOX85mRH06nJwDN4ytZc12gqI/SfTDGuA5MnsA0P/F3BHUEaosMVliQ+BwTOCOY0xu8Y/CWmiGumfwo2BKOo3R81wiNKna5qoLQqBcLnMBZLsdh/oO6HQuS2h2VyR97VUSrqrfGpN4PzrCbZl51MIgeqeBZqh7yJ+otjvVjcZrRgj5PQCCGKtazEbFcPJ5eGa72+KpWQtkxGeoqWY1O9r8Yfx/2HJKLMeDi2NAdRy17AInxTzUAkUP2urnerWdkuKQakMwFoGL3DvY6ToINqdqp7K+aPtFU6MrukGiSes8GKeFfkbm98iJh6pgpEqcwf0AhzpqLdY1FpoxKsArnve4vmMi6o/ZeUmrSDiL/wZbmRYCl3Pg1fAv4n/CRDHR1mPuqVmvSJon4hdlGtJ3UqxE9BjJou3BfiXut/Qx+DFx4yk2sY84IR0HryBObpkmYC1rjk7wiOAeSDjt48j/AFZhl7Ht2Bt6vrFbEL3E4qfY3xi54ZreFJrRCoRosZNdD0ngexS88oQkvinhBGrmvOKExdgDohnYykiuhkXaCabzojG2Tlj6i8l91Fbj3T8AUxMYGD1ZePfERR+KUuA1kpxrDWDt9RmwWqe6CZdXXEs5Dy1IcUbSBqp8ifc3xn84xhuYey0/LyEtttybxFsP1W8Rq+paoUj9Yu5GlIeVD22O5FtQnkF9ijeew08Th6Pd4I/gvxSH6NO/9U+fdd+jH/Qmkv2T5PhhMZuxY5sQhVPMhdbr7VbqFfXi7ChnbZ1fgg4QmELoM3Y0TnwcjvEUca+ZwzKz1tmc4EgKvQAAAP//gA35VgAAAAZJREFUAwBM+gdFlgRZNQAAAABJRU5ErkJggg==' as image,
        avanti_z_ex_emp_pers.employee_number,
		avanti_z_ex_emp_data.location_description,
        now() as created_at,
        now() as updated_at,
        avanti_z_ex_emp_data.active
      FROM public.avanti_z_ex_emp_pers
      LEFT JOIN public.avanti_z_ex_emp_data ON avanti_z_ex_emp_data.employee_number = avanti_z_ex_emp_pers.employee_number
      WHERE 	(avanti_z_ex_emp_pers.work_email IS NOT NULL OR avanti_z_ex_emp_pers.avanti_user_id IS NOT NULL)			
      ) AS user_list
    WHERE work_email IS NOT NULL
    ) AS ranked_list
    WHERE RANK = 1
    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      external_id = EXCLUDED.external_id,
      department = EXCLUDED.department,
      is_active = EXCLUDED.is_active,
      image = EXCLUDED.image,
      updated_at = now();
    $BODY$;`,
  );

  await prismaAdmin.$executeRawUnsafe(`ALTER PROCEDURE public.insert_avanti_users() OWNER TO postgres;`);

  await prisma.$executeRawUnsafe(`CALL public.insert_avanti_users();`);
}

async function FindCreateSystemProcess(processKey: TSystemProcess) {
  const SYSTEM_PROCESS_KEY = SYSTEM_PROCESS_MANIFEST[processKey].key;
  const SYSTEM_PROCESS_DEFAULT_PARAMETER = SYSTEM_PROCESS_MANIFEST[processKey].defaultParameter;

  const processTag = `${SYSTEM_PROCESS_KEY}_${process.env.DATABASE_NAME ? process.env.DATABASE_NAME : 'unknown'}`.toUpperCase();

  await prisma.systemProcess.upsert({
    create: { pid: 0, key: processKey, tag: processTag, parameter: SYSTEM_PROCESS_DEFAULT_PARAMETER, createdBy: 0, updatedBy: 0 },
    update: {},
    where: { key: processKey },
    select: { pid: true, tag: true, updatedAt: true },
  });
}

export async function saveSystemProcess({
  pid,
  parameter,
  processTag,
  processKey,
  userId = 0,
}: {
  pid: number;
  parameter: string;
  processTag: string;
  processKey: string;
  userId?: number;
}) {
  try {
    const process = await prisma.systemProcess.upsert({
      create: { pid, key: processKey, tag: processTag, parameter: parameter, createdBy: userId, updatedBy: userId },
      update: { pid, parameter: parameter, updatedBy: userId },
      where: { key: processKey },
      select: { pid: true, tag: true, updatedAt: true },
    });

    return process;
  } catch (err) {
    console.error('[Scheduler] Failed to save metadata:', err);
  }
}

async function deleteAllData() {
  await prisma.eventRoom.deleteMany();
  await prisma.eventRecipient.deleteMany();
  await prisma.eventItem.deleteMany();
  await prisma.roomProperty.deleteMany();
  await prisma.roomRole.deleteMany();
  await prisma.roleResourceAction.deleteMany();
  await prisma.resourceAction.deleteMany();

  await prisma.event.deleteMany();
  await prisma.room.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.sSOProvider.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();

  await prisma.recurrence.deleteMany();
  await prisma.recurrenceCancellation.deleteMany();
  await prisma.recurrenceException.deleteMany();
  await prisma.roomCategory.deleteMany();
  await prisma.property.deleteMany();
  await prisma.role.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.action.deleteMany();
  await prisma.item.deleteMany();
  await prisma.status.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.configuration.deleteMany();

  await prisma.user.deleteMany();
}

async function main() {
  if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production') {
    console.log('Deleting All Data...');
    await deleteAllData();
  }

  FindCreateSystemProcess('ENTRA_SYNC_SCHEDULER');

  console.log('Creating System User...');
  const SYSTEM_USER = await prisma.user.upsert({
    where: { id: 0 },
    update: {},
    create: {
      id: 0,
      name: 'SYSTEM',
      email: '',
      emailVerified: false,
      image: null,
      externalId: '000',
      isActive: false,
      createdBy: 0,
      updatedBy: 0,
    },
  });

  if (process.env.ADMIN_USER_EMAIL) {
    const ADMIN_USER = await prisma.user.upsert({
      where: { email: process.env.ADMIN_USER_EMAIL },
      update: {},
      create: {
        name: 'Admin User',
        email: process.env.ADMIN_USER_EMAIL,
        emailVerified: false,
        image: null,
        externalId: '000',
        isActive: true,
        createdBy: 0,
        updatedBy: 0,
      },
    });
    const adminRole = await FindCreateRole('Admin');
    const adminUserRole = await FindCreateUserRole(adminRole.roleId, ADMIN_USER.id);
  }

  if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
    console.log('Seeding Random Users...');
    //await prisma.user.deleteMany({ where: { NOT: { id: 0 } } });
    CreateRandomUsers(50);
  }

  const actions = await FindCreateActionList();
  const resources = await FindCreateResourceList();
  const resourceActions = await FindCreateResourceActionList(resources, actions);
  const roles = await FindCreateRoleList();
  console.log('Seeding Permission Sets...');
  for (const roleSet of DEFAULT_PERMISSION_SETS) {
    const role = roles[roleSet.ROLE];
    for (const resourceSet of roleSet.SET) {
      const resource = resources[resourceSet.RESOURCE];

      for (const actionName of resourceSet.ACTIONS) {
        const resourceAction = resourceActions[resourceSet.RESOURCE][actionName];
        await FindCreatePermissionSet(role, resourceAction);
      }
    }
  }

  for (const config of CONFIG_MANIFEST) {
    await FindCreateConfigurationSetting(config.key, config.name, config.description, String(config.defaultValue), config.type);
  }

  const roomList: {
    roomId: number;
    name: string;
    color: string;
    icon: string | null;
    publicFacing: boolean;
    createdAt: Date;
    updatedAt: Date;
    roomCategoryId: number;
  }[] = [];

  console.log('Seeding Room Sizes...');
  const { roomCategoryId: category_none } = await FindCreateRoomCategory('None');
  const { roomCategoryId: category_small } = await FindCreateRoomCategory('Small');
  const { roomCategoryId: category_large } = await FindCreateRoomCategory('Large');
  const { roomCategoryId: category_special } = await FindCreateRoomCategory('Special');

  //await FindCreateRooms("All", "zinc", "Asterisk");

  console.log('Seeding Default Rooms...');

  const ClerkOnlyRooms = [roles['Clerk'].roleId];

  roomList.push(await FindCreateRooms('Biggings Room', 'orange', 'book-key', category_large, true, undefined, 1));
  roomList.push(await FindCreateRooms('Plummer Room', 'cyan', 'book-key', category_large, true, undefined, 3));
  roomList.push(await FindCreateRooms('Russ Ramsay', 'zinc', 'book-key', category_large, true, undefined, 4));
  roomList.push(await FindCreateRooms('W.J. Thompson Room', 'fuchsia', 'book-key', category_large, true, undefined, 2));
  roomList.push(await FindCreateRooms('IT Training Room', 'pink', 'book-key', category_large, true, undefined, 8));
  roomList.push(await FindCreateRooms('Council Chambers', 'indigo', 'book-key', category_special, true, undefined, 9));
  roomList.push(await FindCreateRooms('H.C. Hamilton Room', 'lime', 'book-key', category_special, true, undefined, 11));

  roomList.push(await FindCreateRooms('Algoma Board Room', 'red', 'book-key', category_special, false, ClerkOnlyRooms, 12));
  roomList.push(await FindCreateRooms('Cafeteria', 'amber', 'book-key', category_special, false, ClerkOnlyRooms, 13));
  roomList.push(await FindCreateRooms('Penthouse', 'violet', 'book-key', category_special, false, ClerkOnlyRooms, 10));
  roomList.push(await FindCreateRooms('Korah Room', 'green', 'book-key', category_small, true, undefined, 5));
  roomList.push(await FindCreateRooms('Steelton Room', 'slate', 'book-key', category_small, true, undefined, 7));
  roomList.push(await FindCreateRooms('Tarentarus Room', 'blue', 'book-key', category_small, true, undefined, 6));

  const projectorRooms: string[] = ['Biggings Room', 'Plummer Room', 'Russ Ramsay', 'W.J. Thompson Room', 'IT Training Room', 'Council Chambers'];

  const hasProjector = await FindCreateProperty('HasProjector', 'boolean');

  for (const room of roomList) {
    const property = await FindCreateRoomProperty(room.roomId, hasProjector.propertyId, projectorRooms.includes(room.name) ? 'true' : 'false');
  }
  console.log('Seeding Event Statuses...');
  //await FindCreateEventStatus("Created");
  await FindCreateEventStatus('Pending Review', 'circle-pause', 'slate', 'PENDING');
  await FindCreateEventStatus('Confirmed', 'circle-check', 'green', 'APPROVED');
  await FindCreateEventStatus('Rejected', 'circle-x', 'red', 'REJECTED');
  await FindCreateEventStatus('Additional Info Required', 'circle-question-mark', 'blue', 'INFORMATION');

  console.log('Seeding Event Items...');
  await FindCreateItem('Coffee');
  await FindCreateItem('Tea');

  console.log('Seeding Default Admin...');
  //const memberRole = FindCreateUserRole(roleAdmin.roleId, user.id);

  if (process.env.LINKED_SERVER === '1') {
    await createLinkedServer();
  }

  if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
    console.log('Seeding Random Events...');
    await prisma.event.deleteMany();
    await prisma.recurrence.deleteMany();

    CreateRandomEvents(roomList, 200, VISIBLE_HOUR_START, VISIBLE_HOUR_END, TIME_SLOT_INTERVAL_MINUTES);

    CreateRandomEvents(roomList, 2000, VISIBLE_HOUR_START, VISIBLE_HOUR_END, TIME_SLOT_INTERVAL_MINUTES, 1825);

    CreateRandomEvents(roomList, 2000, VISIBLE_HOUR_START, VISIBLE_HOUR_END, TIME_SLOT_INTERVAL_MINUTES, 1825, addDays(new Date(), 1825), true);

    console.log('Seeding Edge Case Multi-Day Events...');
    await CreateEdgeCaseMultiDayEvents(roomList);
  }
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
