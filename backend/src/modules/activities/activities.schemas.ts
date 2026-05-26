import { z } from 'zod'

export const listActivitiesQuerySchema = z.object({
  status: z.string().optional(),
  keyword: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
})
