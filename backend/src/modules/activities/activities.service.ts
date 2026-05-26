import prisma from '../../shared/prisma/client.js'
import { badRequest, notFound } from '../../shared/errors/app-error.js'
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js'
import { assertUserHasAnyRole } from '../../shared/auth/roles.js'

async function toDto(activity: any) {
  const registeredCount = await prisma.recruitmentSignup.count({
    where: { recruitment: { activityId: activity.id }, status: 'APPROVED' },
  })

  return {
    id: activity.id,
    title: activity.title,
    applicationId: activity.applicationId,
    organizationId: activity.organizationId,
    organizationName: activity.organization?.name ?? '',
    organizerId: activity.organizerId,
    organizerName: activity.organizer?.realName ?? null,
    status: activity.status,
    startAt: activity.startTime ? activity.startTime.toISOString() : new Date().toISOString(),
    endAt: activity.endTime ? activity.endTime.toISOString() : new Date().toISOString(),
    location: activity.application?.location ?? null,
    capacity: 0,
    registeredCount,
    brief: activity.application?.summary ?? '',
    cover: null,
    createdAt: activity.createdAt.toISOString(),
    updatedAt: activity.updatedAt.toISOString(),
  }
}

export const activitiesService = {
  async listActivities(query: Record<string, unknown>) {
    const { page, pageSize } = parsePagination(query)
    const status = typeof query.status === 'string' ? query.status : undefined
    const keyword = typeof query.keyword === 'string' ? query.keyword : undefined

    const where: any = {}
    if (status) where.status = status
    if (keyword) where.title = { contains: keyword, mode: 'insensitive' }

    const [items, total] = await prisma.$transaction([
      prisma.activity.findMany({
        where,
        include: { organization: true, organizer: true, application: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activity.count({ where }),
    ])

    const mapped = []
    for (const item of items) {
      mapped.push(await toDto(item))
    }

    return { items: mapped, meta: buildPaginationMeta(total, { page, pageSize }) }
  },

  async listMyActivities(userId: string) {
    const items = await prisma.activity.findMany({
      where: { organizerId: userId },
      include: { organization: true, organizer: true, application: true },
      orderBy: { createdAt: 'desc' },
    })

    const mapped = []
    for (const item of items) {
      mapped.push(await toDto(item))
    }

    return { items: mapped, meta: buildPaginationMeta(items.length, { page: 1, pageSize: items.length }) }
  },

  async getActivityById(id: string) {
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { organization: true, organizer: true, application: true },
    })
    if (!activity) throw notFound('活动不存在')
    return toDto(activity)
  },

  async startActivity(userId: string, id: string) {
    const activity = await prisma.activity.findUnique({ where: { id } })
    if (!activity) throw notFound('活动不存在')
    if (activity.organizerId !== userId) {
      await assertUserHasAnyRole(userId, ['SYS_ADMIN'])
    }
    if (!['PLANNED', 'RECRUITING'].includes(activity.status)) {
      throw badRequest('当前状态不可开始')
    }

    const updated = await prisma.activity.update({
      where: { id },
      data: { status: 'ONGOING' },
      include: { organization: true, organizer: true, application: true },
    })

    return toDto(updated)
  },

  async finishActivity(userId: string, id: string) {
    const activity = await prisma.activity.findUnique({ where: { id } })
    if (!activity) throw notFound('活动不存在')
    if (activity.organizerId !== userId) {
      await assertUserHasAnyRole(userId, ['SYS_ADMIN'])
    }
    if (activity.status !== 'ONGOING') {
      throw badRequest('当前状态不可结束')
    }

    const updated = await prisma.activity.update({
      where: { id },
      data: { status: 'FINISHED' },
      include: { organization: true, organizer: true, application: true },
    })

    return toDto(updated)
  },
}
