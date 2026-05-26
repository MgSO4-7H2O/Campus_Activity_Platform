import { z } from 'zod'

export const createActivityApplicationSchema = z.object({
  title: z.string().max(200),
  organizationId: z.string().uuid(),
  brief: z.string().min(1),
  expectedStart: z.string().datetime(),
  expectedEnd: z.string().datetime(),
  expectedScale: z.number().int().nonnegative(),
  budget: z.number().nonnegative(),
  location: z.string().optional(),
})

export const updateActivityApplicationSchema = createActivityApplicationSchema.partial()
