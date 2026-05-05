import { z } from 'zod'

export const createActivityApplicationSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().max(200),
  summary: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional()
})

export const updateActivityApplicationSchema = createActivityApplicationSchema.partial()
