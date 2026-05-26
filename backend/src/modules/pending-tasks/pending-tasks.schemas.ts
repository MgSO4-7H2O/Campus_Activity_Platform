import { z } from 'zod'

export const pendingTaskStatusSchema = z.enum(['PENDING', 'PROCESSED', 'CANCELLED'])

export const pendingTaskQuerySchema = z.object({
  status: pendingTaskStatusSchema.optional(),
})

export const pendingTaskIdParamSchema = z.object({
  id: z.string().uuid(),
})
