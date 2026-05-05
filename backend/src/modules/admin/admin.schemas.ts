import { z } from 'zod'

export const createRoleApplicationSchema = z.object({
  targetRoleCode: z.enum(['ORGANIZER', 'REVIEWER', 'SYS_ADMIN']),
  organizationId: z.string().uuid().optional(),
  reason: z.string().max(1000).optional(),
})

export const reviewRoleApplicationSchema = z.object({
  result: z.enum(['APPROVED', 'REJECTED']),
  reviewComment: z.string().max(1000).optional(),
})
