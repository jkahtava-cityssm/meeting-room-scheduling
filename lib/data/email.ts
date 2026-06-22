import { prisma } from '@/prisma';
import { buildEmailContext } from '../email-helpers';
import { TEmailAction } from '../types';
import { IFlattenedEvent } from './events';

export async function createEmailQueue(event: IFlattenedEvent, action: TEmailAction) {
  try {
    const emailContext = await buildEmailContext(event, action);

    if (!emailContext) {
      console.warn(`[Queue Sync] Skipped adding event ${event.eventId} to queue: Context returned undefined.`);
      return null;
    }

    const queuedItem = await prisma.emailQueue.create({
      data: {
        eventId: Number(event.eventId),
        status: 'PENDING',
        emailContext: JSON.stringify(emailContext),
      },
    });

    return queuedItem;
  } catch (error) {
    console.error(`[Queue Sync] Failed to create email queue entry for event ${event?.eventId}:`, error);
    throw error;
  }
}
