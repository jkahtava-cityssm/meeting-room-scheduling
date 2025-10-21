import { PrismaClient } from "@prisma/client";
import { DEFAULT_RESOURCES, DEFAULT_USER_ROLES, TColors } from "../lib/types";
import { addDays, differenceInDays, endOfDay, startOfDay } from "date-fns";
import { EVENTDESCRIPTIONS, EVENTS, RECURRENCE_PATTERN, RECURRENCE_TYPE } from "./seed-data";
import { ByWeekday, datetime, RRule } from "rrule";

const prisma = new PrismaClient();

const prismaAdmin = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_ADMIN, // e.g., user with elevated privileges
    },
  },
});

async function FindCreateAction(name: string) {
  let record = await prisma.action.findFirst({ where: { name: name } });

  if (!record) {
    record = await prisma.action.create({ data: { name: name } });
  }

  return record;
}

async function FindCreateRole(name: string) {
  let record = await prisma.role.findFirst({ where: { name: name } });

  if (!record) {
    record = await prisma.role.create({ data: { name: name } });
  }

  return record;
}

async function FindCreateResource(name: string) {
  let record = await prisma.resource.findFirst({ where: { name: name } });

  if (!record) {
    record = await prisma.resource.create({ data: { name: name } });
  }

  return record;
}

async function FindCreateRoleResourceAction(roleId: number, resourceId: number, actionId: number, permit: boolean) {
  let record = await prisma.roleResourceAction.findFirst({
    where: { roleId: roleId, resourceId: resourceId, actionId: actionId },
  });

  if (!record) {
    record = await prisma.roleResourceAction.create({
      data: { roleId: roleId, resourceId: resourceId, actionId: actionId, permit: permit },
    });
  }

  return record;
}

async function FindCreatePermissionSet(
  role: { roleId: number; createdAt: Date; updatedAt: Date; name: string },
  actions: {
    actionCreate: { actionId: number; createdAt: Date; updatedAt: Date; name: string };
    actionRead: { actionId: number; createdAt: Date; updatedAt: Date; name: string };
    actionUpdate: { actionId: number; createdAt: Date; updatedAt: Date; name: string };
    actionDelete: { actionId: number; createdAt: Date; updatedAt: Date; name: string };
  },
  resource: { resourceId: number; createdAt: Date; updatedAt: Date; name: string },
  permissions: { create: boolean; read: boolean; update: boolean; delete: boolean }
) {
  const resourceActionEventCreate = await FindCreateRoleResourceAction(
    role.roleId,
    resource.resourceId,
    actions.actionCreate.actionId,
    permissions.create
  );
  const resourceActionEventRead = await FindCreateRoleResourceAction(
    role.roleId,
    resource.resourceId,
    actions.actionRead.actionId,
    permissions.read
  );
  const resourceActionEventUpdate = await FindCreateRoleResourceAction(
    role.roleId,
    resource.resourceId,
    actions.actionUpdate.actionId,
    permissions.update
  );
  const resourceActionEventDelete = await FindCreateRoleResourceAction(
    role.roleId,
    resource.resourceId,
    actions.actionDelete.actionId,
    permissions.delete
  );

  return { resourceActionEventCreate, resourceActionEventRead, resourceActionEventUpdate, resourceActionEventDelete };
}

async function FindCreateUserRole(roleId: number, userId: number) {
  let record = await prisma.userRole.findFirst({
    where: { roleId: roleId, userId: userId },
  });

  if (!record) {
    record = await prisma.userRole.create({
      data: { roleId: roleId, userId: userId },
    });
  }

  return record;
}

async function FindCreateRoomScope(name: string) {
  let record = await prisma.roomScope.findFirst({
    where: { name: name },
  });

  if (!record) {
    record = await prisma.roomScope.create({
      data: { name: name },
    });
  }
  return record;
}

async function FindCreateRooms(name: string, color: TColors, icon: string) {
  let record = await prisma.room.findFirst({
    where: { name: name },
  });

  if (!record) {
    record = await prisma.room.create({
      data: { name: name, color: color, icon: icon, roomScopeId: 1 },
    });
  }
  return record;
}

async function FindCreateEventStatus(name: string) {
  let record = await prisma.status.findFirst({
    where: { name: name },
  });

  if (!record) {
    record = await prisma.status.create({
      data: { name: name },
    });
  }
  return record;
}

function FindRoomID(
  roomName: string,
  rooms: { name: string; createdAt: Date; updatedAt: Date; roomId: number; color: string; icon: string | null }[]
) {
  const test = rooms.find((room) => {
    return room.name === roomName;
  });

  return test?.roomId ?? 0;
}

function getRandomDescription(): string {
  const numberOfLines = Math.floor(Math.random() * EVENTDESCRIPTIONS.length);
  let newDescription = "";
  for (let index = 0; index <= numberOfLines; index++) {
    newDescription += EVENTDESCRIPTIONS[index] + "\n";
  }
  return newDescription;
}

async function getActiveUsers(): Promise<{ id: number }[]> {
  const result = await prisma.user.findMany({ where: { employeeActive: true }, select: { id: true } });

  return result;
}

// This was generated by AI -- minus the part where I added my wedding as an "easter egg" :)
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
  maxRangeInDays: number = 30
) {
  // Date range: maxRangeInDays days before and after Now()
  const startRange = addDays(new Date(), maxRangeInDays);
  const endRange = addDays(new Date(), -maxRangeInDays);

  const userList = await getActiveUsers();

  for (let index = 0; index < maxEvents; index++) {
    // Determine if this is a multi-day event (10% chance)
    const isMultiDay = Math.random() < 0.1;

    const startDate = new Date(startRange.getTime() + Math.random() * (endRange.getTime() - startRange.getTime()));

    // Set time between 8 AM and 8 PM
    startDate.setHours(8 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 4) * 15, 0, 0);

    const endDate = new Date(startDate);

    if (isMultiDay) {
      // Multi-day event: Add 1-12 days
      const additionalDays = Math.floor(Math.random() * 12) + 1;
      endDate.setDate(startDate.getDate() + additionalDays);

      endDate.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 4) * 15, 0, 0);
    } else {
      const durationMinutes = (Math.floor(Math.random() * 11) + 2) * 15; // 30 to 180 minutes, multiple of 15
      endDate.setTime(endDate.getTime() + durationMinutes * 60 * 1000);
    }
    const eventIndex = Math.floor(Math.random() * EVENTS.length);
    const userIndex = Math.floor(Math.random() * userList.length);


    const b = await prisma.event.create({
      data: {
        roomId: rooms[Math.floor(Math.random() * rooms.length)].roomId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        title: EVENTS[eventIndex],
        description: getRandomDescription(),
        recurrenceId: await CreateRandomRecurrence(startDate, endDate),
        statusId: 1,
        userId: userList[userIndex].id,
      },
    });
  }
}

function randomToggle(chance: "75" | "50" | "25" | "10") {
  switch (chance) {
    case "75":
      return Math.random() < 0.75;
      break;
    case "50":
      return Math.random() < 0.5;
      break;
    case "25":
      return Math.random() < 0.25;
      break;
    case "10":
    default:
      return Math.random() < 0.1;
      break;
  }
}

async function CreateRandomRecurrence(startDate: Date, endDate: Date) {
  //IGNORE MULTI DAY EVENTS WE DONT WANT MULTI DAY RECURRING EVENTS
  if (differenceInDays(endOfDay(endDate), startOfDay(startDate)) >= 1) {
    return undefined;
  }

  const TypeValue = RECURRENCE_TYPE[Math.floor(Math.random() * RECURRENCE_TYPE.length)];
  const PatternValue = RECURRENCE_PATTERN[Math.floor(Math.random() * RECURRENCE_PATTERN.length)];

  const occurrences = Math.floor(Math.random() * 100) + 1;

  let interval = 0;
  let dayValue = 0;
  let monthValue = 0;

  const maxPossibleDay: number[] = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const weekdayArray: ByWeekday[] = [];

  switch (PatternValue) {
    case "Every X Days":
      //PeriodValue = "Daily";
      interval = Math.floor(Math.random() * 7) + 1;
      break;
    case "Every Weekday":
      //PeriodValue = "Daily";
      interval = 1;
      weekdayArray.push(RRule.MO);
      weekdayArray.push(RRule.TU);
      weekdayArray.push(RRule.WE);
      weekdayArray.push(RRule.TH);
      weekdayArray.push(RRule.FR);
      break;
    case "Every X Weeks":
      //PeriodValue = "Weekly";
      interval = Math.floor(Math.random() * 7) + 1;
      break;
    case "Every X Weeks on Every Selected Day":
      //PeriodValue = "Weekly";
      interval = Math.floor(Math.random() * 7) + 1;

      if (randomToggle("25")) weekdayArray.push(RRule.MO);
      if (randomToggle("25")) weekdayArray.push(RRule.TU);
      if (randomToggle("25")) weekdayArray.push(RRule.WE);
      if (randomToggle("25")) weekdayArray.push(RRule.TH);
      if (randomToggle("25")) weekdayArray.push(RRule.FR);
      if (randomToggle("25")) weekdayArray.push(RRule.SA);
      if (randomToggle("25")) weekdayArray.push(RRule.SU);

      if (weekdayArray.length === 0) weekdayArray.push(RRule.TU);

      break;
    case "Every X Months on X Day":
      //PeriodValue = "Monthly";
      interval = Math.floor(Math.random() * 12) + 1;
      dayValue = Math.floor(Math.random() * 31) + 1;

      break;
    case "Every X Year on X Month on X Day":
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

  if (TypeValue === "Occurrences") {
    switch (PatternValue) {
      case "Every X Days":
        newRule = new RRule({
          freq: RRule.DAILY,
          interval: interval,
          byweekday: weekdayArray,
          dtstart: convertDateToRRuleDate(startDate),
          count: occurrences,
          until: null,
        });
        break;
      case "Every Weekday":
        newRule = new RRule({
          freq: RRule.DAILY,
          interval: interval,
          byweekday: weekdayArray,
          dtstart: convertDateToRRuleDate(startDate),
          count: occurrences,
          until: null,
        });
        break;
      case "Every X Weeks":
        newRule = new RRule({
          freq: RRule.WEEKLY,
          interval: interval,
          byweekday: weekdayArray,
          dtstart: convertDateToRRuleDate(startDate),
          count: occurrences,
          until: null,
        });
      case "Every X Weeks on Every Selected Day":
        newRule = new RRule({
          freq: RRule.WEEKLY,
          interval: interval,
          byweekday: weekdayArray,
          dtstart: convertDateToRRuleDate(startDate),
          count: occurrences,
          until: null,
        });
        break;
      case "Every X Months on X Day":
        newRule = new RRule({
          freq: RRule.MONTHLY,
          interval: interval,
          dtstart: convertDateToRRuleDate(startDate),
          bymonthday: dayValue,
          count: occurrences,
          until: null,
        });
        break;
      case "Every X Year on X Month on X Day":
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
  } else if (TypeValue === "Between") {
  }

  
  if (!newRule) {
    return null;
  }

  //console.log(newRule.all().at(-1));
  /*if (!newRule.all().at(-1)) {
    //console.log(newRule);
    //console.log(newRule.toString());
  }*/
  const newEndDate = newRule.all().at(-1); //parseISO(newRule.all().at(-1)?.toISOString());

  if (!newEndDate) {
    //console.log("NO END DATE");
    return null;
  }

  const recurrence = await prisma.recurrence.create({
    data: {
      rule: newRule.toString(),
      startDate: startDate,
      endDate: newEndDate, //newRule.all().at(-1) ?? "",
    },
  });

  return recurrence.recurrenceId;
}

export function convertDateToRRuleDate(date: Date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())
  );
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
                                                    active text
                                                  )
                                                  SERVER ${process.env.LINKED_SERVER_NAME}
                                                  OPTIONS (schema_name 'public', table_name 'avanti_z_ex_emp_data');`);

  await prismaAdmin.$executeRawUnsafe(
    `GRANT USAGE ON FOREIGN SERVER ${process.env.LINKED_SERVER_NAME} TO ${process.env.DATABASE_USER_USERNAME};`
  );
  await prismaAdmin.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO ${process.env.DATABASE_USER_USERNAME};`);
  await prismaAdmin.$executeRawUnsafe(
    `GRANT SELECT ON TABLE public.avanti_z_ex_emp_pers TO ${process.env.DATABASE_USER_USERNAME};`
  );
  await prismaAdmin.$executeRawUnsafe(
    `GRANT SELECT ON TABLE public.avanti_z_ex_emp_data TO ${process.env.DATABASE_USER_USERNAME};`
  );

  await prismaAdmin.$executeRawUnsafe(
    `CREATE OR REPLACE PROCEDURE public.insert_avanti_users()
    LANGUAGE 'sql'
    AS $BODY$
    INSERT INTO public.user
    (name, email, image, employee_number,employee_active,created_at, updated_at)
    SELECT employee_full_name,
        work_email,
        image,
        employee_number,
        employee_active,
        created_at,
        updated_at
    FROM
    (
    SELECT 	employee_full_name,
        work_email,
        image,
        employee_number,
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
      employee_number = EXCLUDED.employee_number,
      employee_active = EXCLUDED.employee_active,
      image = EXCLUDED.image,
      updated_at = now();
    $BODY$;`
  );

  await prismaAdmin.$executeRawUnsafe(`ALTER PROCEDURE public.insert_avanti_users() OWNER TO postgres;`);

  await prisma.$executeRawUnsafe(`CALL public.insert_avanti_users();`);
}

async function main() {
  if (process.env.LINKED_SERVER === "1") {
    await createLinkedServer();
  }
  else
  {
     await prisma.user.upsert({
    where: { email: "Default@Default.com" },
    update: {},
    create: { name: "Default", 
              email: "Default@Default.com",
              emailVerified: false, 
              image: null, 
              employeeNumber: "0", 
              employeeActive: true
     },
  })
  }

  const actionCreate = await FindCreateAction("Create");
  const actionRead = await FindCreateAction("Read");
  const actionUpdate = await FindCreateAction("Update");
  const actionDelete = await FindCreateAction("Delete");

  const actions = { actionCreate, actionRead, actionUpdate, actionDelete };

  for (const role of DEFAULT_USER_ROLES) {
    const dbRole = await FindCreateRole(role);

    for (const resource of DEFAULT_RESOURCES) {
      const defaultPermission = {
        create: (resource === "Event" && role === "User") || role === "Admin" || role === "Clerk" ? true : false,
        read: true,
        update: role === "Admin" || role === "Clerk" ? true : false,
        delete: role === "Admin" || role === "Clerk" ? true : false,
      };
      const dbResource = await FindCreateResource(resource);
      await FindCreatePermissionSet(dbRole, actions, dbResource, defaultPermission);
    }
  }

  /*const roleUser = await FindCreateRole("User");
  const roleClerk = await FindCreateRole("Clerk");
  const roleAdmin = await FindCreateRole("Admin");

  const resourceEvent = await FindCreateResource("Event");
  const resourceAPI = await FindCreateResource("API");
  const resourceImpersonate = await FindCreateResource("Impersonate");
  

  await FindCreatePermissionSet(roleUser, actions, resourceEvent, {
    create: false,
    read: true,
    update: false,
    delete: false,
  });

  await FindCreatePermissionSet(roleClerk, actions, resourceEvent, {
    create: false,
    read: true,
    update: false,
    delete: false,
  });

  await FindCreatePermissionSet(roleAdmin, actions, resourceEvent, {
    create: true,
    read: true,
    update: true,
    delete: true,
  });

  await FindCreatePermissionSet(roleAdmin, actions, resourceAPI, {
    create: true,
    read: true,
    update: true,
    delete: true,
  });

  await FindCreatePermissionSet(roleAdmin, actions, resourceImpersonate, {
    create: true,
    read: true,
    update: true,
    delete: true,
  });
*/
  const roomList: {
    name: string;
    createdAt: Date;
    updatedAt: Date;
    roomId: number;
    color: string;
    icon: string | null;
  }[] = [];

  await FindCreateRoomScope("Public");
  await FindCreateRoomScope("Private");

  //await FindCreateRooms("All", "zinc", "Asterisk");
  roomList.push(await FindCreateRooms("Algoma Board Room", "red", "BookKey"));
  roomList.push(await FindCreateRooms("Biggings Room", "orange", "BookKey"));
  roomList.push(await FindCreateRooms("Cafeteria", "amber", "BookKey"));
  roomList.push(await FindCreateRooms("Council Chambers", "indigo", "BookKey"));
  roomList.push(await FindCreateRooms("H.C. Hamilton Room", "lime", "BookKey"));
  roomList.push(await FindCreateRooms("Korah Room", "green", "BookKey"));
  roomList.push(await FindCreateRooms("Penthouse", "violet", "BookKey"));
  roomList.push(await FindCreateRooms("W.J. Thompson Room", "fuchsia", "BookKey"));
  roomList.push(await FindCreateRooms("Plummer Room", "cyan", "BookKey"));
  roomList.push(await FindCreateRooms("Steelton Room", "slate", "BookKey"));
  roomList.push(await FindCreateRooms("Tarentarus Room", "blue", "BookKey"));

  //await FindCreateEventStatus("Created");
  await FindCreateEventStatus("Pending Review");
  await FindCreateEventStatus("Confirmed");
  await FindCreateEventStatus("Rejected");
  await FindCreateEventStatus("Additional Info Required");

  const user = await prisma.user.findFirst({ where: { email: "j.kahtava@cityssm.on.ca" } });
  if (!user) {
    console.log("No users found, cannot continue seeding");
    return;
  }

  await prisma.event.deleteMany();
  await prisma.recurrence.deleteMany();

  //CreateRandomEvents(roomList, 200);

  CreateRandomEvents(roomList, 2000, 1825);

  //const memberRole = FindCreateUserRole(roleAdmin.roleId, user.id);

  /*
  const JordanKMember = await prisma.member.upsert({
    where: { userId: user?.id },
    update: {},
    create: { userId: user?.id, 
      theme: "dark",
      userId: 1
     },
  });*/
  /*


  const alice = await prisma.user.upsert({
    where: { email: "alice@prisma.io" },
    update: {},
    create: {
      email: "alice@prisma.io",
      name: "Alice",
      posts: {
        create: {
          title: "Check out Prisma with Next.js",
          content: "https://www.prisma.io/nextjs",
          published: true,
        },
      },
    },
  });
  const bob = await prisma.user.upsert({
    where: { email: "bob@prisma.io" },
    update: {},
    create: {
      email: "bob@prisma.io",
      name: "Bob",
      posts: {
        create: [
          {
            title: "Follow Prisma on Twitter",
            content: "https://twitter.com/prisma",
            published: true,
          },
          {
            title: "Follow Nexus on Twitter",
            content: "https://twitter.com/nexusgql",
            published: true,
          },
        ],
      },
    },
  });*/
  //console.log({ alice, bob });
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
