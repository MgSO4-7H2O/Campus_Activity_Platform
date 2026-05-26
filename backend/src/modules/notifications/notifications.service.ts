import prisma from '../../shared/prisma/client.js'
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js'
import { notFound } from '../../shared/errors/app-error.js'

function toDto(receipt: any) {
  const notification = receipt.notification
  const type = notification.sourceType === 'ANNOUNCEMENT'
    ? 'ANNOUNCE'
    : notification.sourceType
      ? 'FLOW'
      : 'SYSTEM'

  return {
    id: notification.id,
    recipientId: receipt.userId,
    type,
    title: notification.title,
    body: notification.content,
    link: null,
    read: receipt.isRead,
    createdAt: notification.createdAt.toISOString(),
    readAt: receipt.readAt ? receipt.readAt.toISOString() : null,
  }
}

export const notificationsService = {
  async listNotifications(userId: string, query: Record<string, unknown>) {
    const { page, pageSize } = parsePagination(query)
    const read = typeof query.read === 'string' ? query.read === 'true' : undefined

    const where: any = { userId }
    if (read !== undefined) where.isRead = read

    const [receipts, total] = await prisma.$transaction([
      prisma.notificationReceipt.findMany({
        where,
        include: { notification: true },
        orderBy: { notification: { createdAt: 'desc' } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notificationReceipt.count({ where }),
    ])

    return {
      items: receipts.map(toDto),
      meta: buildPaginationMeta(total, { page, pageSize }),
    }
  },

  async getUnreadCount(userId: string) {
    return prisma.notificationReceipt.count({
      where: { userId, isRead: false },
    })
  },

  async markRead(userId: string, notificationId: string) {
    const receipt = await prisma.notificationReceipt.findUnique({
      where: { notificationId_userId: { notificationId, userId } },
      include: { notification: true },
    })

    if (!receipt) throw notFound('通知不存在')

    const updated = await prisma.notificationReceipt.update({
      where: { notificationId_userId: { notificationId, userId } },
      data: { isRead: true, readAt: new Date() },
      include: { notification: true },
    })

    return toDto(updated)
  },

  async markAllRead(userId: string) {
    await prisma.notificationReceipt.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
  },

  async notifyUsers(userIds: string[], payload: { title: string; content: string; sourceType?: any; sourceId?: string }) {
    if (userIds.length === 0) return

    const notification = await prisma.notification.create({
      data: {
        title: payload.title,
        content: payload.content,
        targetType: 'USER',
        targetValue: null,
        sourceType: payload.sourceType ?? 'SYSTEM',
        sourceId: payload.sourceId,
      },
    })

    const receipts = userIds.map((userId) => ({
      notificationId: notification.id,
      userId,
    }))

    await prisma.notificationReceipt.createMany({ data: receipts })
  },

  async notifyRole(roleCode: string, payload: { title: string; content: string; sourceType?: any; sourceId?: string }) {
    const users = await prisma.userRole.findMany({
      where: { role: { code: roleCode } },
      select: { userId: true },
    })

    await this.notifyUsers(users.map((u) => u.userId), payload)
  },

  async notifyOrganization(organizationId: string, payload: { title: string; content: string; sourceType?: any; sourceId?: string }) {
    const users = await prisma.userOrganization.findMany({
      where: { organizationId },
      select: { userId: true },
    })

    await this.notifyUsers(users.map((u) => u.userId), payload)
  },
}
