import crypto from 'node:crypto'
import prisma from '../../shared/prisma/client.js'
import { badRequest, conflict, notFound } from '../../shared/errors/app-error.js'
import { assertUserHasAnyRole } from '../../shared/auth/roles.js'
import { notificationsService } from '../notifications/notifications.service.js'
import { createSystemLog } from '../../shared/utils/system-log.js'

function toSessionDto(session: any, activityTitle: string, signedCount: number, totalCount: number) {
  return {
    id: session.id,
    activityId: session.activityId,
    title: activityTitle,
    method: session.mode,
    code: session.checkinCode ?? session.qrcodeToken ?? null,
    startAt: session.startTime.toISOString(),
    endAt: session.endTime.toISOString(),
    status: session.status === 'PENDING' ? 'DRAFT' : session.status,
    signedCount,
    totalCount,
    createdAt: session.startTime.toISOString(),
  }
}

function toRecordDto(record: any, realName: string | null, method: string) {
  return {
    id: record.id,
    sessionId: record.sessionId,
    userId: record.userId,
    realName,
    status: record.status,
    checkedInAt: record.checkedInAt ? record.checkedInAt.toISOString() : new Date().toISOString(),
    method,
  }
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateToken() {
  return crypto.randomBytes(16).toString('hex')
}

export const checkinService = {
  async createSession(userId: string, input: any) {
    const activity = await prisma.activity.findUnique({ where: { id: input.activityId } })
    if (!activity) throw notFound('活动不存在')

    if (activity.organizerId !== userId) {
      await assertUserHasAnyRole(userId, ['SYS_ADMIN'])
    }

    const session = await prisma.checkinSession.create({
      data: {
        activityId: input.activityId,
        mode: input.method,
        checkinCode: input.method === 'CODE' ? generateCode() : null,
        qrcodeToken: input.method === 'QRCODE' ? generateToken() : null,
        startTime: new Date(input.startAt),
        endTime: new Date(input.endAt),
        status: 'PENDING',
        createdBy: userId,
      },
    })

    return toSessionDto(session, activity.title, 0, 0)
  },

  async listSessionsByActivity(activityId: string) {
    const activity = await prisma.activity.findUnique({ where: { id: activityId } })
    if (!activity) throw notFound('活动不存在')

    const sessions = await prisma.checkinSession.findMany({
      where: { activityId },
      orderBy: { startTime: 'asc' },
    })

    const totalCount = await prisma.recruitmentSignup.count({
      where: { recruitment: { activityId }, status: 'APPROVED' },
    })

    const records = await prisma.checkinRecord.groupBy({
      by: ['sessionId'],
      where: { activityId },
      _count: { sessionId: true },
    })

    const recordMap = new Map<string, number>()
    records.forEach((row) => recordMap.set(row.sessionId, row._count.sessionId))

    return sessions.map((session) =>
      toSessionDto(session, activity.title, recordMap.get(session.id) ?? 0, totalCount)
    )
  },

  async openSession(userId: string, sessionId: string) {
    const session = await prisma.checkinSession.findUnique({ where: { id: sessionId } })
    if (!session) throw notFound('签到场次不存在')

    const activity = await prisma.activity.findUnique({ where: { id: session.activityId } })
    if (!activity) throw notFound('活动不存在')

    if (activity.organizerId !== userId) {
      await assertUserHasAnyRole(userId, ['SYS_ADMIN'])
    }

    const updated = await prisma.checkinSession.update({
      where: { id: sessionId },
      data: { status: 'OPEN' },
    })

    const approvedUsers = await prisma.recruitmentSignup.findMany({
      where: { recruitment: { activityId: activity.id }, status: 'APPROVED' },
      include: { user: true },
    })

    await notificationsService.notifyUsers(
      approvedUsers.map((r) => r.userId),
      {
        title: `签到开始：${activity.title}`,
        content: '签到已开启，请及时完成签到。',
        sourceType: 'ACTIVITY',
        sourceId: activity.id,
      }
    )

    await createSystemLog({
      userId,
      action: 'CHECKIN_OPEN',
      resourceType: 'checkin_session',
      resourceId: sessionId,
    })

    const signedCount = await prisma.checkinRecord.count({ where: { sessionId } })
    return toSessionDto(updated, activity.title, signedCount, approvedUsers.length)
  },

  async closeSession(userId: string, sessionId: string) {
    const session = await prisma.checkinSession.findUnique({ where: { id: sessionId } })
    if (!session) throw notFound('签到场次不存在')

    const activity = await prisma.activity.findUnique({ where: { id: session.activityId } })
    if (!activity) throw notFound('活动不存在')

    if (activity.organizerId !== userId) {
      await assertUserHasAnyRole(userId, ['SYS_ADMIN'])
    }

    const updated = await prisma.checkinSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED' },
    })

    const signedCount = await prisma.checkinRecord.count({ where: { sessionId } })
    const totalCount = await prisma.recruitmentSignup.count({
      where: { recruitment: { activityId: activity.id }, status: 'APPROVED' },
    })

    return toSessionDto(updated, activity.title, signedCount, totalCount)
  },

  async checkin(userId: string, sessionId: string, code?: string) {
    const session = await prisma.checkinSession.findUnique({ where: { id: sessionId } })
    if (!session) throw notFound('签到场次不存在')
    if (session.status !== 'OPEN') throw badRequest('签到未开启')

    const activity = await prisma.activity.findUnique({ where: { id: session.activityId } })
    if (!activity) throw notFound('活动不存在')

    if (session.mode === 'CODE' && session.checkinCode !== code) {
      throw badRequest('签到码错误')
    }
    if (session.mode === 'QRCODE' && session.qrcodeToken !== code) {
      throw badRequest('二维码无效')
    }

    const signup = await prisma.recruitmentSignup.findFirst({
      where: {
        userId,
        status: 'APPROVED',
        recruitment: { activityId: activity.id },
      },
      include: { user: true },
    })

    if (!signup) throw badRequest('未找到已通过的报名记录')

    const existing = await prisma.checkinRecord.findFirst({
      where: { sessionId, userId },
    })
    if (existing) throw conflict('已签到')

    const now = new Date()
    if (now < session.startTime || now > session.endTime) {
      throw badRequest('不在签到时间范围内')
    }

    const status = now > session.startTime ? 'LATE' : 'CHECKED_IN'
    const record = await prisma.checkinRecord.create({
      data: {
        sessionId,
        activityId: activity.id,
        userId,
        status,
        checkedInAt: now,
      },
    })

    return toRecordDto(record, signup.user.realName ?? null, session.mode)
  },

  async listRecords(userId: string, sessionId: string) {
    const session = await prisma.checkinSession.findUnique({ where: { id: sessionId } })
    if (!session) throw notFound('签到场次不存在')

    const activity = await prisma.activity.findUnique({ where: { id: session.activityId } })
    if (!activity) throw notFound('活动不存在')

    if (activity.organizerId !== userId) {
      await assertUserHasAnyRole(userId, ['SYS_ADMIN'])
    }

    const records = await prisma.checkinRecord.findMany({
      where: { sessionId },
      include: { user: true },
      orderBy: { checkedInAt: 'asc' },
    })

    return records.map((record) =>
      toRecordDto(record, record.user.realName ?? null, session.mode)
    )
  },

  async addManualRecord(userId: string, sessionId: string, input: { userId: string; status?: 'CHECKED_IN' | 'LATE' }) {
    const session = await prisma.checkinSession.findUnique({ where: { id: sessionId } })
    if (!session) throw notFound('签到场次不存在')

    const activity = await prisma.activity.findUnique({ where: { id: session.activityId } })
    if (!activity) throw notFound('活动不存在')

    if (activity.organizerId !== userId) {
      await assertUserHasAnyRole(userId, ['SYS_ADMIN'])
    }

    const targetUser = await prisma.user.findUnique({ where: { id: input.userId } })
    if (!targetUser) throw notFound('用户不存在')

    const existing = await prisma.checkinRecord.findFirst({
      where: { sessionId, userId: input.userId },
      include: { user: true },
    })

    if (existing) {
      return toRecordDto(existing, existing.user.realName ?? null, session.mode)
    }

    const record = await prisma.checkinRecord.create({
      data: {
        sessionId,
        activityId: session.activityId,
        userId: input.userId,
        status: input.status ?? 'CHECKED_IN',
        checkedInAt: new Date(),
      },
      include: { user: true },
    })

    return toRecordDto(record, record.user.realName ?? null, session.mode)
  },
}
