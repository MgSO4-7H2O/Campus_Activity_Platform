import { z } from 'zod'

export const announcementCategorySchema = z.enum(['NEWS', 'NOTICE', 'RECRUITMENT', 'SYSTEM'])

export const listAnnouncementsQuerySchema = z.object({
  category: announcementCategorySchema.optional(),
  pinned: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
})

export const upsertAnnouncementSchema = z.object({
  title: z.string().min(1),
  category: announcementCategorySchema,
  content: z.string().min(1),
  pinned: z.boolean().optional(),
  relatedActivityId: z.string().uuid().optional(),
})
