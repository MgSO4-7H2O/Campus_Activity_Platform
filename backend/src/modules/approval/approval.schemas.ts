import { z } from 'zod'

export const routeIdSchema = z.object({
  id: z.string().uuid(),
})

export const reviewActivityApplicationSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'NEED_MORE']),
  comment: z.string().optional(),
})
