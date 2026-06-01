import prisma from '../../shared/prisma/client.js'
import { badRequest, notFound } from '../../shared/errors/app-error.js'
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js'
import { toPublicFileUrl } from '../../shared/utils/uploads.js'
import { approvalService } from '../approval/approval.service.js'
import { pendingTasksService } from '../pending-tasks/pending-tasks.service.js'
import { notificationsService } from '../notifications/notifications.service.js'
import { createSystemLog } from '../../shared/utils/system-log.js'
import { assertUserHasAnyRole } from '../../shared/auth/roles.js'

function toDto(app: any, statusOverride?: string) {
  return {
    id: app.id,
    activityId: app.activityId,
    activityTitle: app.activity?.title ?? '',
    applicantId: app.applicantId,
    applicantName: app.applicant?.realName ?? null,
    status: statusOverride ?? app.status,
    summary: app.summary ?? '',
    participants: app.participantCount ?? 0,
    submittedAt: app.submittedAt ? app.submittedAt.toISOString() : null,
    currentApprovalLevel: app.reviewRecords?.length ? Math.max(...app.reviewRecords.map((r: any) => r.level)) : 0,
    attachments: app.attachments?.map((att: any) => ({
      id: att.id,
      applicationId: app.id,
      fileName: att.fileName,
      fileSize: 0,
      fileUrl: att.fileUrl,
      mimeType: null,
      uploadedAt: att.uploadedAt.toISOString(),
    })) ?? [],
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  }
}

async function getLatestReviewRecord(closureId: string) {
  return prisma.closureReviewRecord.findFirst({
    where: { closureApplicationId: closureId },
    orderBy: { reviewedAt: 'desc' },
  })
}

export const closureService = {
  async createClosure(userId: string, input: any) {
    const activity = await prisma.activity.findUnique({ where: { id: input.activityId } })
    if (!activity) throw notFound('活动不存在')
    if (activity.organizerId !== userId) throw badRequest('仅负责人可提交结项')
    if (activity.status !== 'FINISHED') throw badRequest('仅已结束活动可提交结项')

    const existing = await prisma.closureApplication.findUnique({
      where: { activityId: input.activityId },
    })
    if (existing) throw badRequest('该活动已存在结项申请')

    const created = await prisma.closureApplication.create({
      data: {
        activityId: input.activityId,
        applicantId: userId,
        summary: input.summary,
        participantCount: input.participants,
        status: 'DRAFT',
      },
      include: { activity: true, applicant: true, attachments: true, reviewRecords: true },
    })

    return toDto(created)
  },

  async listMyClosures(userId: string, query: Record<string, unknown>) {
    const { page, pageSize } = parsePagination(query)
    const status = typeof query.status === 'string' ? query.status : undefined

    const where: any = { applicantId: userId }
    if (status && status !== 'NEED_MORE') where.status = status

    const [items, total] = await prisma.$transaction([
      prisma.closureApplication.findMany({
        where,
        include: { activity: true, applicant: true, attachments: true, reviewRecords: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.closureApplication.count({ where }),
    ])

    const mapped = []
    for (const item of items) {
      const latest = await getLatestReviewRecord(item.id)
      const override = latest?.result === 'NEED_MORE' ? 'NEED_MORE' : undefined
      if (status && status === 'NEED_MORE' && override !== 'NEED_MORE') continue
      mapped.push(toDto(item, override))
    }

    return { items: mapped, meta: buildPaginationMeta(total, { page, pageSize }) }
  },

  async getClosureById(userId: string, id: string) {
    const closure = await prisma.closureApplication.findUnique({
      where: { id },
      include: { activity: true, applicant: true, attachments: true, reviewRecords: true },
    })
    if (!closure) throw notFound('结项不存在')
    if (closure.applicantId !== userId) throw badRequest('无权查看该结项')

    const latest = await getLatestReviewRecord(id)
    const override = latest?.result === 'NEED_MORE' ? 'NEED_MORE' : undefined
    return toDto(closure, override)
  },

  async updateClosure(userId: string, id: string, input: any) {
    const closure = await prisma.closureApplication.findUnique({
      where: { id },
      include: { reviewRecords: true },
    })
    if (!closure) throw notFound('结项不存在')
    if (closure.applicantId !== userId) throw badRequest('无权修改该结项')

    const latest = await getLatestReviewRecord(id)
    const canEdit = closure.status === 'DRAFT' || latest?.result === 'NEED_MORE'
    if (!canEdit) throw badRequest('当前状态不可编辑')

    const updated = await prisma.closureApplication.update({
      where: { id },
      data: {
        summary: input.summary,
        participantCount: input.participants,
      },
      include: { activity: true, applicant: true, attachments: true, reviewRecords: true },
    })

    return toDto(updated)
  },

  async addAttachment(userId: string, id: string, file?: Express.Multer.File) {
    if (!file) throw badRequest('未收到文件')

    const closure = await prisma.closureApplication.findUnique({ where: { id } })
    if (!closure) throw notFound('结项不存在')
    if (closure.applicantId !== userId) throw badRequest('无权上传附件')

    const attachment = await prisma.closureAttachment.create({
      data: {
        closureApplicationId: id,
        type: 'GENERIC',
        fileName: file.originalname,
        fileUrl: toPublicFileUrl(file.filename),
      },
    })

    return {
      id: attachment.id,
      applicationId: attachment.closureApplicationId,
      fileName: attachment.fileName,
      fileSize: 0,
      fileUrl: attachment.fileUrl,
      mimeType: null,
      uploadedAt: attachment.uploadedAt.toISOString(),
    }
  },

  async submitClosure(userId: string, id: string) {
    const closure = await prisma.closureApplication.findUnique({
      where: { id },
      include: { activity: true },
    })
    if (!closure) throw notFound('结项不存在')
    if (closure.applicantId !== userId) throw badRequest('无权提交该结项')

    const latest = await getLatestReviewRecord(id)
    const canSubmit = closure.status === 'DRAFT' || latest?.result === 'NEED_MORE'
    if (!canSubmit) throw badRequest('当前状态不可提交')

    const orgChain = await approvalService.resolveApprovalOrganizations(closure.activity.organizationId)
    const firstOrgId = orgChain[0]
    if (!firstOrgId) throw badRequest('无法确定审核组织')

    const reviewer = await approvalService.findReviewerByOrganization(firstOrgId)
    if (!reviewer) throw badRequest('未找到审核人')

    const updated = await prisma.closureApplication.update({
      where: { id },
      data: {
        status: 'APPROVING',
        submittedAt: new Date(),
      },
      include: { activity: true, applicant: true, attachments: true, reviewRecords: true },
    })

    await pendingTasksService.createPendingTask({
      assigneeId: reviewer.id,
      taskType: 'CLOSURE_REVIEW',
      relatedResourceType: 'CLOSURE_APPLICATION',
      relatedResourceId: id,
      title: `结项审核: ${updated.activity.title}`,
      createdBy: userId,
    })

    return toDto(updated)
  },

  async reviewClosure(userId: string, id: string, input: { decision: 'APPROVE' | 'REJECT' | 'NEED_MORE'; comment?: string }) {
    await assertUserHasAnyRole(userId, ['REVIEWER', 'SYS_ADMIN'])
    const closure = await prisma.closureApplication.findUnique({
      where: { id },
      include: { activity: true },
    })
    if (!closure) throw notFound('结项不存在')
    if (closure.status !== 'APPROVING' && closure.status !== 'SUBMITTED') {
      throw badRequest('当前状态不可审核')
    }

    const latest = await getLatestReviewRecord(id)
    const level = latest?.result === 'NEED_MORE' ? latest.level : (latest?.level ?? 0) + 1

    const reviewer = await prisma.user.findUnique({
      where: { id: userId },
      include: { userOrganizations: true },
    })
    if (!reviewer) throw notFound('审核人不存在')
    const reviewerOrgId = reviewer.userOrganizations[0]?.organizationId ?? closure.activity.organizationId

    await prisma.$transaction(async (tx) => {
      await tx.closureReviewRecord.create({
        data: {
          closureApplicationId: id,
          reviewerId: userId,
          reviewerOrganizationId: reviewerOrgId,
          level,
          result: input.decision === 'APPROVE' ? 'APPROVED' : input.decision === 'REJECT' ? 'REJECTED' : 'NEED_MORE',
          comment: input.comment,
        },
      })

      await pendingTasksService.markTaskProcessedByResource({
        relatedResourceType: 'CLOSURE_APPLICATION',
        relatedResourceId: id,
      })

      if (input.decision === 'REJECT') {
        await tx.closureApplication.update({
          where: { id },
          data: { status: 'REJECTED' },
        })
        return
      }

      if (input.decision === 'NEED_MORE') {
        await tx.closureApplication.update({
          where: { id },
          data: { status: 'SUBMITTED' },
        })
        return
      }

      const orgChain = await approvalService.resolveApprovalOrganizations(closure.activity.organizationId)
      const nextOrgId = orgChain[level]

      if (!nextOrgId) {
        await tx.closureApplication.update({
          where: { id },
          data: { status: 'APPROVED' },
        })

        await tx.activity.update({
          where: { id: closure.activityId },
          data: { status: 'CLOSED' },
        })

        return
      }

      const nextReviewer = await approvalService.findReviewerByOrganization(nextOrgId)
      if (!nextReviewer) throw badRequest('未找到可用审核人')

      await pendingTasksService.createPendingTask({
        assigneeId: nextReviewer.id,
        taskType: 'CLOSURE_REVIEW',
        relatedResourceType: 'CLOSURE_APPLICATION',
        relatedResourceId: id,
        title: `结项审核: ${closure.activity.title}`,
        createdBy: userId,
      })
    })

    await createSystemLog({
      userId,
      action: 'CLOSURE_REVIEW',
      resourceType: 'closure_application',
      resourceId: id,
      details: { decision: input.decision, level },
    })

    await notificationsService.notifyUsers([closure.applicantId], {
      title: '结项审核结果更新',
      content: `你的结项申请已${input.decision === 'APPROVE' ? '通过' : input.decision === 'REJECT' ? '拒绝' : '退回补充材料'}`,
      sourceType: 'CLOSURE_APPLICATION',
      sourceId: id,
    })

    const updated = await prisma.closureApplication.findUnique({
      where: { id },
      include: { activity: true, applicant: true, attachments: true, reviewRecords: true },
    })
    if (!updated) throw notFound('结项不存在')

    const latestAfter = await getLatestReviewRecord(id)
    const override = latestAfter?.result === 'NEED_MORE' ? 'NEED_MORE' : undefined
    return toDto(updated, override)
  },

  async getReviewRecords(id: string) {
    const records = await prisma.closureReviewRecord.findMany({
      where: { closureApplicationId: id },
      include: { reviewer: true },
      orderBy: { reviewedAt: 'asc' },
    })

    return records.map((record) => ({
      id: record.id,
      applicationId: record.closureApplicationId,
      level: record.level,
      reviewerId: record.reviewerId,
      reviewerName: record.reviewer?.realName ?? null,
      organizationId: record.reviewerOrganizationId,
      decision: record.result === 'APPROVED' ? 'APPROVE' : record.result === 'REJECTED' ? 'REJECT' : 'NEED_MORE',
      comment: record.comment ?? null,
      decidedAt: record.reviewedAt.toISOString(),
    }))
  },
}
