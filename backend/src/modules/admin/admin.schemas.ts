import { z } from 'zod'

export const reviewRoleApplicationSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().max(1000).optional(),
})

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'DISABLED']),
  reason: z.string().max(200).optional(),
})
