import { z } from 'zod'

export const createRoleApplicationSchema = z.object({
  appliedRole: z.enum(['ORGANIZER', 'REVIEWER', 'SYS_ADMIN']),
  organizationId: z.string().uuid().optional(),
  reason: z.string().min(10, 'Reason is required')
})

export const reviewRoleApplicationSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional()
})

export type CreateRoleApplicationBody = z.infer<typeof createRoleApplicationSchema>
export type ReviewRoleApplicationBody = z.infer<typeof reviewRoleApplicationSchema>