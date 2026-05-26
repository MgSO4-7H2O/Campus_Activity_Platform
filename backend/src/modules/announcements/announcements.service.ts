import prisma from '../../shared/prisma/client.js'
import { notFound } from '../../shared/errors/app-error.js'
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js'
import { assertUserHasAnyRole } from '../../shared/auth/roles.js'
import { createSystemLog } from '../../shared/utils/system-log.js'
import { notificationsService } from '../notifications/notifications.service.js'

function toDbType(category: string) {
  if (category === 'NEWS') return 'NEWS'
  if (category === 'NOTICE') return 'NOTICE'
  if (category === 'RECRUITMENT') return 'RECRUITMENT_NOTICE'
  return 'SYSTEM_NOTICE'
}

function toDto(announcement: any) {
  const category = announcement.type === 'RECRUITMENT_NOTICE'
    ? 'RECRUITMENT'
    : announcement.type === 'SYSTEM_NOTICE'
      ? 'SYSTEM'
      : announcement.type

  return {
    id: announcement.id,
    title: announcement.title,
    category,
    status: announcement.status,
    content: announcement.content,
    authorId: announcement.publisherId,
    authorName: announcement.publisher?.realName ?? null,
    relatedActivityId: announcement.activityId,
    pinned: announcement.isPinned,
    publishedAt: announcement.publishedAt ? announcement.publishedAt.toISOString() : null,
    archivedAt: null,
    createdAt: announcement.createdAt.toISOString(),
    updatedAt: announcement.updatedAt.toISOString(),
  }
}

export const announcementsService = {
  async listAnnouncements(query: Record<string, unknown>) {
    const { page, pageSize } = parsePagination(query)
    const category = typeof query.category === 'string' ? query.category : undefined
    const pinned = typeof query.pinned === 'string' ? query.pinned === 'true' : undefined

    const where: any = {}
    if (category) where.type = toDbType(category)
    if (pinned !== undefined) where.isPinned = pinned

    const [items, total] = await prisma.$transaction([
      prisma.announcement.findMany({
        where,
        include: { publisher: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.announcement.count({ where }),
    ])

    return {
      items: items.map(toDto),
      meta: buildPaginationMeta(total, { page, pageSize }),
    }
  },

  async getAnnouncement(id: string) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: { publisher: true },
    })
    if (!announcement) throw notFound('公告不存在')
    return toDto(announcement)
  },

  async createAnnouncement(userId: string, input: any) {
    await assertUserHasAnyRole(userId, ['ORGANIZER', 'SYS_ADMIN'])

    const announcement = await prisma.announcement.create({
      data: {
        title: input.title,
        content: input.content,
        type: toDbType(input.category),
        isPinned: input.pinned ?? false,
        activityId: input.relatedActivityId,
        publisherId: userId,
        status: 'DRAFT',
      },
      include: { publisher: true },
    })

    return toDto(announcement)
  },

  async updateAnnouncement(userId: string, id: string, input: any) {
    await assertUserHasAnyRole(userId, ['ORGANIZER', 'SYS_ADMIN'])

    const announcement = await prisma.announcement.findUnique({ where: { id } })
    if (!announcement) throw notFound('公告不存在')

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: input.title,
        content: input.content,
        type: input.category ? toDbType(input.category) : undefined,
        isPinned: input.pinned,
        activityId: input.relatedActivityId,
      },
      include: { publisher: true },
    })

    return toDto(updated)
  },

  async publishAnnouncement(userId: string, id: string) {
    await assertUserHasAnyRole(userId, ['ORGANIZER', 'SYS_ADMIN'])

    const updated = await prisma.announcement.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
      include: { publisher: true },
    })

    await createSystemLog({
      userId,
      action: 'ANNOUNCEMENT_PUBLISH',
      resourceType: 'announcement',
      resourceId: updated.id,
    })

    await notificationsService.notifyRole('BASIC_USER', {
      title: `新公告：${updated.title}`,
      content: updated.content.slice(0, 120),
      sourceType: 'ANNOUNCEMENT',
      sourceId: updated.id,
    })

    return toDto(updated)
  },

  async archiveAnnouncement(userId: string, id: string) {
    await assertUserHasAnyRole(userId, ['ORGANIZER', 'SYS_ADMIN'])

    const updated = await prisma.announcement.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: { publisher: true },
    })

    return toDto(updated)
  },
}
