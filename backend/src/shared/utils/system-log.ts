import { Prisma } from '@prisma/client'

import prisma from '../prisma/client.js'

export async function createSystemLog(input: {
  userId?: string | null
  action: string
  resourceType?: string | null
  resourceId?: string | null
  ipAddress?: string | null
  details?: Prisma.InputJsonObject | null
}) {
  await prisma.systemLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      ipAddress: input.ipAddress ?? null,
      details: input.details === null ? Prisma.JsonNull : input.details,
    },
  })
}
