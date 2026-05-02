import { z } from 'zod'

export const registerBodySchema = z.object({
  username: z.string().trim().min(3).max(20),
  password: z.string().min(8).max(72),
  userType: z.enum(['student', 'teacher']),
  realName: z.string().trim().min(1).max(50),
  phone: z.string().trim().min(3).max(20).optional(),
  email: z.string().trim().email().max(100).optional(),
})

export type RegisterBody = z.infer<typeof registerBodySchema>

export const loginBodySchema = z.object({
  username: z.string().trim().min(1).max(20),
  password: z.string().min(1).max(72),
})

export type LoginBody = z.infer<typeof loginBodySchema>

