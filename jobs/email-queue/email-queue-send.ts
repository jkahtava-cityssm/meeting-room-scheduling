import 'server-only';

import { SEmailContextSchema, sendEventNotificationEmail } from '@/lib/email-helpers';
import { prisma } from '../../prisma';
import z from 'zod/v4';

interface PendingEventRow {
  emailQueueId: number;
  eventId: number;
  createdAt: Date;
}

function groupEvents(pendingEvents: PendingEventRow[]) {
  const toSend: number[] = [];
  const toSkip: number[] = [];

  const seenEventIds = new Set<number>();

  for (const row of pendingEvents) {
    if (!seenEventIds.has(row.eventId)) {
      // Because the list is ordered DESC by createdAt,
      // the first time we see this eventId, it's the newest snapshot.
      seenEventIds.add(row.eventId);
      toSend.push(row.emailQueueId);
    } else {
      // We've already grabbed the newest one, so this older row gets skipped.
      toSkip.push(row.emailQueueId);
    }
  }

  return {
    toSend,
    toSkip,
  };
}

export async function processNextEmailJob(): Promise<{ jobProcessed: boolean }> {
  const pendingEvents = await prisma.emailQueue.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    select: { emailQueueId: true, eventId: true, createdAt: true },
  });

  if (pendingEvents.length === 0) {
    return { jobProcessed: false };
  }

  const { toSend, toSkip } = groupEvents(pendingEvents);

  if (toSkip.length > 0) {
    await prisma.emailQueue.updateMany({ data: { status: 'SKIPPED' }, where: { emailQueueId: { in: toSkip } } });
  }

  const uuid = `${crypto.randomUUID()}`;
  const tag = `PROCESSING_${uuid}`;
  await prisma.emailQueue.updateMany({ data: { status: tag }, where: { emailQueueId: { in: toSend } } });

  for (const emailQueueId of toSend) {
    const emailQueue = await prisma.emailQueue.findUnique({
      select: { emailContext: true, attempts: true },
      where: { emailQueueId: emailQueueId, status: tag },
    });

    if (emailQueue) {
      const currentAttempts = emailQueue.attempts + 1;
      await prisma.emailQueue.update({
        where: { emailQueueId: emailQueueId },
        data: { attempts: currentAttempts },
      });

      try {
        const emailContext = z.parse(SEmailContextSchema, JSON.parse(emailQueue.emailContext));

        await sendEventNotificationEmail(emailContext);

        const sent = await prisma.emailQueue.update({ data: { status: 'SENT' }, where: { emailQueueId: emailQueueId } });
      } catch (error: unknown) {
        console.error(`Failed processing email ${emailQueueId}:`, error);

        const errorMessage = error instanceof Error ? error.message : 'Execution error';

        await prisma.emailQueue.update({
          where: { emailQueueId: emailQueueId },
          data: {
            status: currentAttempts >= 3 ? 'FAILED' : 'PENDING',
            errorMessage: errorMessage,
          },
        });
      }
    }
  }

  return { jobProcessed: true };
}
