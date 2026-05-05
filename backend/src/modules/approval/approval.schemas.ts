import { z } from 'zod'

export const getPendingTasksQuerySchema = z.object({
  status: z.enum(['PENDING', 'PROCESSED', 'CANCELLED']).optional(),
  taskType: z.enum(['APPLICATION_REVIEW', 'CLOSURE_REVIEW', 'SIGNUP_REVIEW', 'ROLE_APPLICATION_REVIEW']).optional()
})
