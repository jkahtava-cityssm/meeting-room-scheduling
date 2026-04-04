export const CALENDAR_VIEWS = ['day', 'week', 'month', 'year', 'agenda', 'all', 'public', 'request'] as const;
export type TCalendarView = (typeof CALENDAR_VIEWS)[number];

export const STATUS_KEYS = ['PENDING', 'APPROVED', 'REJECTED', 'INFORMATION'] as const;
export type TStatusKey = (typeof STATUS_KEYS)[number];

export const COLOR_OPTIONS = [
  'red',
  'rose',
  'razzmatazz',
  'pink',
  'japonica',
  'orange',
  'amber',
  'yellow',
  'manz',
  'harvestGold',
  'lime',
  'sulu',
  'malachite',
  'camarone',
  'green',
  'emerald',
  'watercourse',
  'teal',
  'cyan',
  'scooter',
  'disabled',
  'approved',
  'rejected',
  'sky',
  'blue',
  'havelockBlue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'viola',
  'slate',
  'zinc',
  'invisible',
] as const;

export type TColors = (typeof COLOR_OPTIONS)[number];

export type TWorkingHours = { [key: number]: { from: number; to: number } };
export type TVisibleHours = { from: number; to: number };

export type TEventItems = ['None', 'Coffee', 'Tea', 'Coffee & Tea'];

export type TRecurrenceType = 'Between' | 'Occurrences' | 'Forever';
export type TRecurrencePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type TRecurrencePattern =
  | 'Every X Days'
  | 'Every Weekday'
  | 'Every X Weeks'
  | 'Every X Weeks on Every Selected Day'
  | 'Every X Months on X Day'
  | 'Every X Year on X Month on X Day';

export const CONFIGURATION_KEYS = [
  'visibleHoursStart',
  'visibleHoursEnd',
  'timeSlotInterval',
  'singleSignOnEnabled',
  'defaultUserRole',
  'maxBookingSpan',
] as const;

//export type TConfigurationKeys = (typeof CONFIGURATION_KEYS)[number];

export const CONFIG_MANIFEST = [
  {
    key: 'visibleHoursStart',
    name: 'Earliest Visible Hour',
    description: 'The earliest hour that is visible in the calendar view.',
    defaultValue: 8,
    type: 'number',
  },

  {
    key: 'visibleHoursEnd',
    name: 'Latest Visible Hour',
    description: 'The latest hour that is visible in the calendar view.',
    defaultValue: 8,
    type: 'number',
  },
  {
    key: 'timeSlotInterval',
    name: 'Event Time Slots',
    description: 'The time interval (in minutes) for each event slot in the calendar view.',
    defaultValue: 30,
    type: 'number',
  },
  {
    key: 'singleSignOnEnabled',
    name: 'Single Sign On',
    description: 'Whether Single Sign On is enabled for the application.',
    defaultValue: false,
    type: 'boolean',
  },
  {
    key: 'defaultUserRole',
    name: 'Default Role',
    description: 'The default role assigned to new users.',
    defaultValue: -1,
    type: 'number',
  },
  {
    key: 'maxBookingSpan',
    name: 'Max Booking Span',
    description: '0 = no limit, determines the maximum number in the future a user can create events',
    defaultValue: 30,
    type: 'number',
  },
] as const;

export type TConfigurationKeys = (typeof CONFIG_MANIFEST)[number]['key'];

export type TConfigurationRecord = {
  [K in (typeof CONFIG_MANIFEST)[number] as K['key']]: K['type'] extends 'number' ? number : K['type'] extends 'boolean' ? boolean : string;
};

/**
 * Default Roles, Resources, Actions, and Permission Sets
 */

export const DEFAULT_USER_ROLES = ['User', 'Clerk', 'Admin', 'Public', 'Private'] as const;
export type SessionRole = (typeof DEFAULT_USER_ROLES)[number];

export const DEFAULT_RESOURCE_ACTIONS = [
  {
    RESOURCE: 'Event',
    ACTIONS: [
      'Read All',
      'Read Self',
      'Create',
      'Update',
      'Delete',
      'Change Status',
      'Change Assigned',
      'Allow Recurrence',
      'Allow Multi-Day',
      'Ignore Visible Hours',
      'Ignore Booking Span',
      'Allow Multiple Rooms',
    ],
  },
  {
    RESOURCE: 'Room',
    ACTIONS: ['Read', 'Create', 'Update', 'Delete'],
  },
  {
    RESOURCE: 'User',
    ACTIONS: ['Read All', 'Read Self', 'Create', 'Update', 'Delete'],
  },
  {
    RESOURCE: 'Calendar',
    ACTIONS: ['View Day', 'View Week', 'View Month', 'View Year', 'View Agenda', 'View Staff Requests'],
  },
  {
    RESOURCE: 'My Bookings',
    ACTIONS: ['View Day', 'View Week', 'View Month', 'View Year', 'View Agenda'],
  },
  {
    RESOURCE: 'Settings',
    ACTIONS: ['Edit Permissions', 'Edit Rooms', 'Edit Configuration', 'Edit Users'],
  },
] as const;

type ResourceActionDefinition = (typeof DEFAULT_RESOURCE_ACTIONS)[number];
export type SessionResource = ResourceActionDefinition['RESOURCE'];
export type SessionAction = ResourceActionDefinition['ACTIONS'][number];

type ActionsFor<R extends SessionResource> = Extract<ResourceActionDefinition, { RESOURCE: R }>['ACTIONS'][number];

type PermissionResourceUnion = {
  [R in SessionResource]: {
    RESOURCE: R;
    ACTIONS: readonly ActionsFor<R>[];
  };
}[SessionResource];

export type DEFAULT_PERMISSION_SET = {
  ROLE: SessionRole;
  SET: PermissionResourceUnion[];
};

export const DEFAULT_PERMISSION_SETS: DEFAULT_PERMISSION_SET[] = [
  {
    ROLE: 'Clerk',
    SET: [
      {
        RESOURCE: 'Event',
        ACTIONS: [
          'Read Self',
          'Read All',
          'Create',
          'Update',
          'Delete',
          'Change Status',
          'Change Assigned',
          'Allow Recurrence',
          'Allow Multi-Day',
          'Allow Multiple Rooms',
          'Ignore Visible Hours',
          'Ignore Booking Span',
        ],
      },
      { RESOURCE: 'Room', ACTIONS: ['Read', 'Create', 'Update', 'Delete'] },
      { RESOURCE: 'User', ACTIONS: ['Read All'] },
      { RESOURCE: 'Calendar', ACTIONS: ['View Day', 'View Month', 'View Year', 'View Agenda', 'View Week'] },
      {
        RESOURCE: 'My Bookings',
        ACTIONS: ['View Day', 'View Month', 'View Year', 'View Agenda', 'View Week'],
      },
      { RESOURCE: 'Settings', ACTIONS: ['Edit Rooms'] },
    ],
  },
  {
    ROLE: 'User',
    SET: [
      {
        RESOURCE: 'Event',
        ACTIONS: ['Read Self', 'Create', 'Update'],
      },
      { RESOURCE: 'Room', ACTIONS: ['Read'] },
      { RESOURCE: 'User', ACTIONS: ['Read Self'] },
      { RESOURCE: 'Calendar', ACTIONS: [] },
      {
        RESOURCE: 'My Bookings',
        ACTIONS: ['View Day', 'View Month', 'View Year', 'View Agenda', 'View Week'],
      },
      { RESOURCE: 'Settings', ACTIONS: [] },
    ],
  },
];

function makeEnum<T extends readonly string[]>(values: T) {
  return Object.fromEntries(values.map((v) => [v, v])) as {
    [K in T[number]]: K;
  };
}
export const ROLES_ENUM = makeEnum(DEFAULT_USER_ROLES);

//THIS SHOULD REMAIN 96, because it is easily divisible
// 5,10,15,20,30,60
// 12,6,4 ,3 ,2 ,1
// 60/5 = 12, 60/10=6, 60/15=4, 60/20=3, 60/30=2, 60/60=1
export const TIME_BLOCK_SIZE = 96;
