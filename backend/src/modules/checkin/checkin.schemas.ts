import { z } from 'zod'

export const createCheckinSessionSchema = z.object({
  activityId: z.string().uuid(),
  title: z.string().min(1),
  method: z.enum(['CODE', 'QRCODE', 'MANUAL']),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
})

export const checkinCodeSchema = z.object({
  code: z.string().min(1).optional(),
})

export const manualRecordSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(['CHECKED_IN', 'LATE']).optional(),
})
