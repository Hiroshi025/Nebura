import { z } from "zod";

export const TaskRecurrence = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().optional(),
  endDate: z.date().optional(),
  times: z.number().optional(),
});

export const TaskReminder = z.object({
  enabled: z.boolean(),
  timeBefore: z.string(), // e.g. "30 minutes"
  notified: z.boolean().optional(),
});