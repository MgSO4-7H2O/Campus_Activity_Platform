import { z } from 'zod'

export const createSignupSchema = z.object({
  remark: z.string().optional(),
})

export const reviewSignupSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional(),
})
