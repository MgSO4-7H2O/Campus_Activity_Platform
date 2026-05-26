import { z } from 'zod'

export const upsertRecruitmentSchema = z.object({
  activityId: z.string().uuid(),
  title: z.string().min(1),
  capacity: z.number().int().nonnegative(),
  registrationStart: z.string().datetime(),
  registrationEnd: z.string().datetime(),
  allowedUserTypes: z.array(z.enum(['STUDENT', 'TEACHER'])).min(1),
  allowedGrades: z.array(z.string()).optional(),
  allowedMajors: z.array(z.string()).optional(),
  requiresAttachment: z.boolean(),
})
