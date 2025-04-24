import type { TColors } from "@/calendar/types";
import type { IEvent, IRoom } from "@/calendar/interfaces";
import { description } from "@/app/private/layout";

// ================================== //

export const CALENDAR_ROOMS_MOCK: IRoom[] = [
  {
    id: "1",
    name: "Algoma Board Room",
    picturePath: null,
    color: "red",
  },
  {
    id: "2",
    name: "Biggings Room",
    picturePath: null,
    color: "orange",
  },
  {
    id: "3",
    name: "Cafeteria",
    picturePath: null,
    color: "amber",
  },
  {
    id: "4",
    name: "Council Chambers",
    picturePath: null,
    color: "yellow",
  },
  {
    id: "5",
    name: "H.C. Hamilton Room",
    picturePath: null,
    color: "lime",
  },
  {
    id: "6",
    name: "Korah Room",
    picturePath: null,
    color: "green",
  },
  {
    id: "7",
    name: "Penthouse",
    picturePath: null,
    color: "emerald",
  },
  {
    id: "8",
    name: "W.J. Thompson Room",
    picturePath: null,
    color: "teal",
  },
  {
    id: "9",
    name: "Plummer Room",
    picturePath: null,
    color: "cyan",
  },
  {
    id: "10",
    name: "Steelton Room",
    picturePath: null,
    color: "sky",
  },
  {
    id: "11",
    name: "Tarentarus Room",
    picturePath: null,
    color: "blue",
  },
];

const COLORS: TColors[] = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
];

const EVENTS = [
  "Doctor's appointment",
  "Dental cleaning",
  "Eye exam",
  "Therapy session",
  "Business meeting",
  "Team stand-up",
  "Project deadline",
  "Weekly report submission",
  "Client presentation",
  "Marketing strategy review",
  "Networking event",
  "Sales call",
  "Investor pitch",
  "Board meeting",
  "Employee training",
  "Performance review",
  "One-on-one meeting",
  "Lunch with a colleague",
  "HR interview",
  "Conference call",
  "Web development sprint planning",
  "Software deployment",
  "Code review",
  "QA testing session",
  "Cybersecurity audit",
  "Server maintenance",
  "API integration update",
  "Data backup",
  "Cloud migration",
  "System upgrade",
  "Content planning session",
  "Product launch",
  "Customer support review",
  "Team building activity",
  "Legal consultation",
  "Budget review",
  "Financial planning session",
  "Tax filing deadline",
  "Investor relations update",
  "Partnership negotiation",
  "Medical check-up",
  "Vaccination appointment",
  "Blood donation",
  "Gym workout",
  "Yoga class",
  "Physical therapy session",
  "Nutrition consultation",
  "Personal trainer session",
  "Parent-teacher meeting",
  "School open house",
  "College application deadline",
  "Final exam",
  "Graduation ceremony",
  "Job interview",
  "Internship orientation",
  "Office relocation",
  "Business trip",
  "Flight departure",
  "Hotel check-in",
  "Vacation planning",
  "Birthday party",
  "Wedding anniversary",
  "Family reunion",
  "Housewarming party",
  "Community volunteer work",
  "Charity fundraiser",
  "Religious service",
  "Concert attendance",
  "Theater play",
  "Movie night",
  "Sporting event",
  "Football match",
  "Basketball game",
  "Tennis practice",
  "Marathon training",
  "Cycling event",
  "Fishing trip",
  "Camping weekend",
  "Hiking expedition",
  "Photography session",
  "Art workshop",
  "Cooking class",
  "Book club meeting",
  "Grocery shopping",
  "Car maintenance",
  "Home renovation meeting",
];

const description = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla mollis eget ipsum id tristique. Donec in orci in nisl bibendum fermentum. Donec ac enim risus. Fusce sagittis, magna id aliquam viverra, nibh dui posuere mauris, id malesuada libero libero sit amet sem. Suspendisse potenti. Donec ac ante nisi. Nulla a lobortis odio, eget condimentum nisl. Vivamus dictum, augue at vulputate eleifend, nisi mauris dignissim libero, faucibus vehicula tellus urna sed leo. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vitae posuere nibh, id accumsan ante. Suspendisse ac quam ipsum. Sed vestibulum tortor eget risus mattis, ut cursus est finibus. Aenean id felis vel erat porttitor pretium at non leo.
Donec non odio lorem. Vestibulum mattis erat vel gravida interdum. Ut non porta orci. Integer efficitur magna at maximus faucibus. Donec hendrerit dolor vel nulla posuere, vitae rutrum metus suscipit. Fusce blandit elit quis risus sodales maximus. Phasellus placerat vulputate dui luctus facilisis. Nunc sed dignissim velit. Etiam non sapien lacus. Donec nec felis tincidunt, maximus ligula eu, tempor eros. Aenean non porttitor eros. Phasellus laoreet rutrum libero et iaculis.
Praesent scelerisque, nisl eget venenatis suscipit, risus ante consectetur arcu, a cursus ipsum neque ut justo. Mauris enim tellus, mattis quis ultrices id, aliquet eget sem. Pellentesque eu mauris non odio ultricies gravida. Nam mi nisi, commodo vitae vulputate eget, convallis quis libero. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Phasellus eu augue imperdiet, convallis metus in, facilisis ante. Duis faucibus urna vel lacus cursus, dictum ullamcorper nunc iaculis. Donec vitae dolor quis odio semper euismod maximus vitae ex. In hac habitasse platea dictumst. Nulla ac auctor urna. Nullam purus metus, aliquam nec interdum quis, convallis ut purus. Phasellus nec posuere felis, sit amet sagittis est. Duis tincidunt tortor nec lectus tincidunt aliquam. Aliquam erat volutpat.
Pellentesque sagittis, augue non facilisis bibendum, metus mauris blandit dolor, sed lobortis sem enim id lorem. Nulla porttitor ut velit nec malesuada. Suspendisse ut feugiat urna. Vestibulum maximus ut tortor eget lobortis. Sed ac cursus risus, non vehicula purus. Sed ex quam, hendrerit vel tincidunt ut, tincidunt a massa. Proin convallis efficitur purus sit amet dignissim.
Pellentesque at eleifend mauris. Quisque et eros vitae mi sollicitudin molestie vel sed mi. Curabitur et facilisis dolor, id imperdiet ligula. Nulla id orci id lectus pulvinar porttitor et vitae lectus. Aenean convallis varius tortor vitae lobortis. Aenean ac eleifend quam. Sed non sem quis elit pellentesque porta a in risus. In hac habitasse platea dictumst. Integer volutpat est et lacus iaculis, id suscipit est semper. Cras mauris elit, dignissim vel risus quis, efficitur posuere velit. Etiam ornare ullamcorper interdum.`;

// This was generated by AI -- minus the part where I added my wedding as an "easter egg" :)
const mockGenerator = (numberOfEvents: number): IEvent[] => {
  const result: IEvent[] = [];

  const descriptionList = description.split(".");
  /*[
    {
      id: 1204,
      startDate: new Date("2025-09-20T00:00:00-03:00").toISOString(),
      endDate: new Date("2025-09-20T23:59:00-03:00").toISOString(),
      title: "My wedding :)",
      color: "red",
      description: "Can't wait to see the most beautiful woman in that dress!",
      subevent: null,
      room: ROOMS_MOCK[0],
    },
  ];*/

  let currentId = 1;

  const randomRoom = CALENDAR_ROOMS_MOCK[Math.floor(Math.random() * CALENDAR_ROOMS_MOCK.length)];

  // Date range: 30 days before and after now
  const now = new Date();
  const startRange = new Date(now);
  startRange.setDate(now.getDate() - 30);
  const endRange = new Date(now);
  endRange.setDate(now.getDate() + 30);

  // Create an event happening now
  const currentEvent = {
    id: currentId++,
    startDate: new Date(now.getTime() - 30 * 60000).toISOString(),
    endDate: new Date(now.getTime() + 30 * 60000).toISOString(),
    title: EVENTS[Math.floor(Math.random() * EVENTS.length)],
    description: descriptionList[Math.floor(Math.random() * descriptionList.length)],
    subevent: null,
    room: randomRoom,
  };

  // Only add the current event if it's not on September 20th
  if (now.getMonth() !== 8 || now.getDate() !== 20) {
    // Month is 0-indexed (8 = September)
    result.push(currentEvent);
  }

  // Generate the remaining events
  let i = 0;
  let attempts = 0;
  const maxAttempts = numberOfEvents * 3; // Prevent infinite loop with a reasonable max attempts

  while (i < numberOfEvents - 1 && attempts < maxAttempts) {
    attempts++;

    // Determine if this is a multi-day event (10% chance)
    const isMultiDay = Math.random() < 0.1;

    const startDate = new Date(startRange.getTime() + Math.random() * (endRange.getTime() - startRange.getTime()));

    // Skip if the date is September 20th
    if (startDate.getMonth() === 8 && startDate.getDate() === 20) {
      continue;
    }

    // Set time between 8 AM and 8 PM
    startDate.setHours(8 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 4) * 15, 0, 0);

    const endDate = new Date(startDate);

    if (isMultiDay) {
      // Multi-day event: Add 1-4 days
      const additionalDays = Math.floor(Math.random() * 4) + 1;
      endDate.setDate(startDate.getDate() + additionalDays);

      // Ensure multi-day events don't cross September 20th
      const endMonth = endDate.getMonth();
      const endDay = endDate.getDate();
      const startMonth = startDate.getMonth();
      const startDay = startDate.getDate();

      // Check if event spans across September 20th
      if (
        (startMonth === 8 && startDay < 20 && (endMonth > 8 || (endMonth === 8 && endDay >= 20))) ||
        (endMonth === 8 && endDay >= 20 && (startMonth < 8 || (startMonth === 8 && startDay < 20)))
      ) {
        continue;
      }

      endDate.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 4) * 15, 0, 0);
    } else {
      const durationMinutes = (Math.floor(Math.random() * 11) + 2) * 15; // 30 to 180 minutes, multiple of 15
      endDate.setTime(endDate.getTime() + durationMinutes * 60 * 1000);
    }

    result.push({
      id: currentId++,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      title: EVENTS[Math.floor(Math.random() * EVENTS.length)],
      description: descriptionList[Math.floor(Math.random() * descriptionList.length)],
      subevent: null,
      room: CALENDAR_ROOMS_MOCK[Math.floor(Math.random() * CALENDAR_ROOMS_MOCK.length)],
    });

    i++;
  }

  return result;
};

export const CALENDAR_EVENTS_MOCK: IEvent[] = mockGenerator(80);
