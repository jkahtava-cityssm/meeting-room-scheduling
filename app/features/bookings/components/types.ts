import { IEventSingleRoom } from '@/lib/schemas';
import { TColors } from '@/lib/types';

export interface ISection {
  sectionId: string;
  formattedDate: string;
  roomSection: IRoomSection[];
}

export interface IRoomSection {
  roomId: string;
  roomName: string;
  roomColour: TColors;
  eventCards: IEventCard[];
}

export interface IEventCard {
  event: IEventSingleRoom;
  eventCardFields: IEventCardFields;
}

export interface IEventCardFields {
  cardTitle: string;
  color: TColors;
  eventTitle: string;
  badgeName: string;
  roomName: string;
  isMultiRoom: boolean;
  dateRange: string;
  timeRange: string;
  duration: string;
  recurrence: string;
  description: string;
  createdDate: string;
}
