import z from 'zod/v4';

export const EntraSyncSchema = z.object({
  schedule: z.string(),
});

export const EmailQueueSchema = z.object({
  schedule: z.string(),
});
