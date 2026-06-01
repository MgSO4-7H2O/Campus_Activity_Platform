import prisma from '../../shared/prisma/client.js'
import { badRequest, conflict, notFound } from '../../shared/errors/app-error.js'
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js'
import { assertUserHasAnyRole } from '../../shared/auth/roles.js'
import { pendingTasksService } from '../pending-tasks/pending-tasks.service.js'
import { notificationsService } from '../notifications/notifications.service.js'
import { createSystemLog } from '../../shared/utils/system-log.js'
import { toPublicFileUrl } from '../../shared/utils/uploads.js'

function toDto(signup: any, attachments: any[]) {
  return {
    id: signup.id,
    recruitmentId: signup.recruitmentId,
    activityId: signup.recruitment.activityId,
    userId: signup.userId,
    realName: signup.user?.realName ?? null,
    userType: signup.user?.userType ?? 'STUDENT',
    college: signup.user?.studentProfile?.college ?? null,
    major: signup.user?.studentProfile?.major ?? null,
    grade: signup.user?.studentProfile?.grade ? String(signup.user.studentProfile.grade) : null,
    status: signup.status === 'PENDING' ? 'SUBMITTED' : signup.status === 'CANCELLED' ? 'CANCELED' : signup.status,
    submittedAt: signup.appliedAt.toISOString(),
    decisionComment: null,
    decidedAt: signup.reviewedAt ? signup.reviewedAt.toISOString() : null,
    attachments: attachments.map((att) => ({
      id: att.id,
      signupId: att.signupId,
      fileName: att.fileName,
      fileSize: 0,
      fileUrl: att.fileUrl,
      uploadedAt: att.uploadedAt.toISOString(),
    })),
  }
}

export const signupsService = {
  async createSignup(userId: string, recruitmentId: string) {
    const recruitment = await prisma.recruitment.findUnique({
      where: { id: recruitmentId },
      include: { activity: true },
    })
    if (!recruitment) throw notFound('招募不存在')
    if (recruitment.status !== 'PUBLISHED') throw badRequest('招募未发布')

    const now = new Date()
    if (recruitment.signupStartTime && now < recruitment.signupStartTime) {
      throw badRequest('未到报名开始时间')
    }
    if (recruitment.signupEndTime && now > recruitment.signupEndTime) {
      throw badRequest('报名已结束')
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    })
    if (!user) throw notFound('用户不存在')

    if (recruitment.targetUserType !== 'ALL' && recruitment.targetUserType !== user.userType) {
      throw badRequest('用户类型不符合要求')
    }

    if (user.userType === 'STUDENT') {
      const allowedGrades: number[] = []
      if (recruitment.minGrade && recruitment.maxGrade) {
        for (let grade = recruitment.minGrade; grade <= recruitment.maxGrade; grade += 1) {
          allowedGrades.push(grade)
        }
      }

      if (allowedGrades.length && user.studentProfile?.grade && !allowedGrades.includes(user.studentProfile.grade)) {
        throw badRequest('年级不符合要求')
      }

      const allowedMajors = await prisma.recruitmentAllowedMajor.findMany({
        where: { recruitmentId },
      })
      if (allowedMajors.length && user.studentProfile?.major) {
        const ok = allowedMajors.some((major) => major.majorName === user.studentProfile!.major)
        if (!ok) throw badRequest('专业不符合要求')
      }
    }

    const existing = await prisma.recruitmentSignup.findFirst({
      where: { recruitmentId, userId },
    })
    if (existing) throw conflict('请勿重复报名')

    const signup = await prisma.recruitmentSignup.create({
      data: {
        recruitmentId,
        userId,
        status: 'PENDING',
      },
      include: {
        recruitment: true,
        user: { include: { studentProfile: true } },
      },
    })

    await pendingTasksService.createPendingTask({
      assigneeId: recruitment.activity.organizerId,
      taskType: 'SIGNUP_REVIEW',
      relatedResourceType: 'RECRUITMENT_SIGNUP',
      relatedResourceId: signup.id,
      title: `报名审核: ${recruitment.title}`,
      createdBy: userId,
    })

    return toDto(signup, [])
  },

  async listMySignups(userId: string, query: Record<string, unknown>) {
    const { page, pageSize } = parsePagination(query)

    const [items, total] = await prisma.$transaction([
      prisma.recruitmentSignup.findMany({
        where: { userId },
        include: {
          recruitment: true,
          user: { include: { studentProfile: true } },
        },
        orderBy: { appliedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recruitmentSignup.count({ where: { userId } }),
    ])

    const attachments = await prisma.signupAttachment.findMany({
      where: { signupId: { in: items.map((i) => i.id) } },
    })

    const attachmentsMap = new Map<string, any[]>()
    attachments.forEach((att) => {
      const list = attachmentsMap.get(att.signupId) ?? []
      list.push(att)
      attachmentsMap.set(att.signupId, list)
    })

    return {
      items: items.map((item) => toDto(item, attachmentsMap.get(item.id) ?? [])),
      meta: buildPaginationMeta(total, { page, pageSize }),
    }
  },

  async listSignupsByRecruitment(userId: string, recruitmentId: string, query: Record<string, unknown>) {
    const { page, pageSize } = parsePagination(query)
    const status = typeof query.status === 'string' ? query.status : undefined

    const recruitment = await prisma.recruitment.findUnique({
      where: { id: recruitmentId },
      include: { activity: true },
    })
    if (!recruitment) throw notFound('招募不存在')

    if (recruitment.activity.organizerId !== userId) {
      await assertUserHasAnyRole(userId, ['SYS_ADMIN'])
    }

    const where: any = { recruitmentId }
    if (status) {
      where.status = status === 'SUBMITTED' ? 'PENDING' : status === 'CANCELED' ? 'CANCELLED' : status
    }

    const [items, total] = await prisma.$transaction([
      prisma.recruitmentSignup.findMany({
        where,
        include: {
          recruitment: true,
          user: { include: { studentProfile: true } },
        },
        orderBy: { appliedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recruitmentSignup.count({ where }),
    ])

    const attachments = await prisma.signupAttachment.findMany({
      where: { signupId: { in: items.map((i) => i.id) } },
    })

    const attachmentsMap = new Map<string, any[]>()
    attachments.forEach((att) => {
      const list = attachmentsMap.get(att.signupId) ?? []
      list.push(att)
      attachmentsMap.set(att.signupId, list)
    })

    return {
      items: items.map((item) => toDto(item, attachmentsMap.get(item.id) ?? [])),
      meta: buildPaginationMeta(total, { page, pageSize }),
    }
  },

  async getSignupById(userId: string, signupId: string) {
    const signup = await prisma.recruitmentSignup.findUnique({
      where: { id: signupId },
      include: {
        recruitment: { include: { activity: true } },
        user: { include: { studentProfile: true } },
      },
    })
    if (!signup) throw notFound('报名不存在')

    if (signup.userId !== userId && signup.recruitment.activity.organizerId !== userId) {
      await assertUserHasAnyRole(userId, ['SYS_ADMIN'])
    }

    const attachments = await prisma.signupAttachment.findMany({ where: { signupId } })
    return toDto(signup, attachments)
  },

  async reviewSignup(userId: string, signupId: string, input: { decision: 'APPROVE' | 'REJECT'; comment?: string }) {
    const signup = await prisma.recruitmentSignup.findUnique({
      where: { id: signupId },
      include: { recruitment: { include: { activity: true } } },
    })
    if (!signup) throw notFound('报名不存在')

    if (signup.recruitment.activity.organizerId !== userId) {
      await assertUserHasAnyRole(userId, ['SYS_ADMIN'])
    }

    const updated = await prisma.recruitmentSignup.update({
      where: { id: signupId },
      data: {
        status: input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
      include: {
        recruitment: true,
        user: { include: { studentProfile: true } },
      },
    })

    await pendingTasksService.markTaskProcessedByResource({
      relatedResourceType: 'RECRUITMENT_SIGNUP',
      relatedResourceId: signupId,
    })

    await notificationsService.notifyUsers([updated.userId], {
      title: '报名审核结果',
      content: `你的报名已${input.decision === 'APPROVE' ? '通过' : '拒绝'}`,
      sourceType: 'RECRUITMENT_SIGNUP',
      sourceId: signupId,
    })

    await createSystemLog({
      userId,
      action: 'SIGNUP_REVIEW',
      resourceType: 'recruitment_signup',
      resourceId: signupId,
      details: { decision: input.decision, comment: input.comment },
    })

    return toDto(updated, [])
  },

  async cancelSignup(userId: string, signupId: string) {
    const signup = await prisma.recruitmentSignup.findUnique({
      where: { id: signupId },
      include: { recruitment: true },
    })
    if (!signup) throw notFound('报名不存在')
    if (signup.userId !== userId) throw badRequest('无权取消该报名')

    const updated = await prisma.recruitmentSignup.update({
      where: { id: signupId },
      data: { status: 'CANCELLED' },
      include: {
        recruitment: true,
        user: { include: { studentProfile: true } },
      },
    })

    return toDto(updated, [])
  },

  async addAttachment(userId: string, signupId: string, file?: Express.Multer.File) {
    if (!file) throw badRequest('未收到文件')

    const signup = await prisma.recruitmentSignup.findUnique({
      where: { id: signupId },
      include: { recruitment: { include: { activity: true } } },
    })
    if (!signup) throw notFound('报名不存在')
    if (signup.userId !== userId) throw badRequest('无权上传该报名附件')

    const attachment = await prisma.signupAttachment.create({
      data: {
        signupId,
        type: 'GENERIC',
        fileName: file.originalname,
        fileUrl: toPublicFileUrl(file.filename),
      },
    })

    return {
      id: attachment.id,
      signupId: attachment.signupId,
      fileName: attachment.fileName,
      fileSize: 0,
      fileUrl: attachment.fileUrl,
      uploadedAt: attachment.uploadedAt.toISOString(),
    }
  },
}
