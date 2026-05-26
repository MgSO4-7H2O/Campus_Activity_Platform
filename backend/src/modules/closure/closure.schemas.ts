import { z } from 'zod'

export const upsertClosureSchema = z.object({
  activityId: z.string().uuid(),
  summary: z.string().min(1),
  participants: z.number().int().nonnegative(),
})

export const reviewClosureSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'NEED_MORE']),
  comment: z.string().optional(),
})
