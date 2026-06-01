import type { ActivityApplicationStatus, Prisma } from '@prisma/client'

import prisma from '../../shared/prisma/client.js'
import { notFound, badRequest } from '../../shared/errors/app-error.js'
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js'
import { toPublicFileUrl } from '../../shared/utils/uploads.js'
import { createSystemLog } from '../../shared/utils/system-log.js'
import { approvalService } from '../approval/approval.service.js'
import { pendingTasksService } from '../pending-tasks/pending-tasks.service.js'

function toDto(app: any) {
  return {
    id: app.id,
    title: app.title,
    organizationId: app.organizationId,
    organizationName: app.organization?.name ?? null,
    organizerId: app.applicantId,
    organizerName: app.applicant?.realName ?? null,
    status: app.status,
    brief: app.summary ?? '',
    expectedStart: app.startTime ? app.startTime.toISOString() : new Date().toISOString(),
    expectedEnd: app.endTime ? app.endTime.toISOString() : new Date().toISOString(),
    expectedScale: 0,
    budget: 0,
    location: app.location ?? null,
    submittedAt: app.submittedAt ? app.submittedAt.toISOString() : null,
    currentApprovalLevel: app.currentLevel ?? 0,
    attachments: app.attachments?.map((att: any) => ({
      id: att.id,
      applicationId: att.applicationId,
      fileName: att.fileName,
      fileSize: att.fileSize ? Number(att.fileSize) : 0,
      fileUrl: att.fileUrl,
      mimeType: null,
      uploadedAt: att.uploadedAt.toISOString(),
    })) ?? [],
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  }
}

export const activityApplicationsService = {
  async createApplication(applicantId: string, data: any) {
    const created = await prisma.activityApplication.create({
      data: {
        applicantId,
        organizationId: data.organizationId,
        title: data.title,
        summary: data.brief,
        location: data.location,
        startTime: new Date(data.expectedStart),
        endTime: new Date(data.expectedEnd),
        status: 'DRAFT',
      },
      include: { organization: true, applicant: true, attachments: true },
    })

    return toDto(created)
  },

  async getMyApplications(applicantId: string, query: Record<string, unknown>) {
    const { page, pageSize } = parsePagination(query)
    const status = typeof query.status === 'string' ? (query.status as ActivityApplicationStatus) : undefined

    const where: Prisma.ActivityApplicationWhereInput = {
      applicantId,
      ...(status ? { status } : {}),
    }

    const [items, total] = await prisma.$transaction([
      prisma.activityApplication.findMany({
        where,
        include: { organization: true, applicant: true, attachments: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activityApplication.count({ where }),
    ])

    return {
      items: items.map(toDto),
      meta: buildPaginationMeta(total, { page, pageSize }),
    }
  },

  async getApplicationById(applicationId: string, requesterId: string) {
    const app = await prisma.activityApplication.findUnique({
      where: { id: applicationId },
      include: { organization: true, applicant: true, attachments: true },
    })
    if (!app) throw notFound('立项申请不存在')
    if (app.applicantId !== requesterId) {
      throw badRequest('无权查看该申请')
    }
    return toDto(app)
  },

  async updateApplication(applicationId: string, applicantId: string, data: any) {
    const app = await prisma.activityApplication.findUnique({ where: { id: applicationId } })
    if (!app) throw notFound('立项申请不存在')
    if (app.applicantId !== applicantId) throw badRequest('Only the applicant can update this.')
    if (app.status !== 'DRAFT' && app.status !== 'NEED_MORE') {
      throw badRequest(`Cannot update application in ${app.status} status.`)
    }

    const updated = await prisma.activityApplication.update({
      where: { id: applicationId },
      data: {
        organizationId: data.organizationId,
        title: data.title,
        summary: data.brief,
        location: data.location,
        startTime: data.expectedStart ? new Date(data.expectedStart) : undefined,
        endTime: data.expectedEnd ? new Date(data.expectedEnd) : undefined,
      },
      include: { organization: true, applicant: true, attachments: true },
    })

    return toDto(updated)
  },

  async addAttachment(applicationId: string, userId: string, file?: Express.Multer.File) {
    if (!file) throw badRequest('未收到文件')
    const app = await prisma.activityApplication.findUnique({ where: { id: applicationId } })
    if (!app) throw notFound('立项申请不存在')
    if (app.applicantId !== userId) throw badRequest('无权上传该申请附件')

    const attachment = await prisma.applicationAttachment.create({
      data: {
        applicationId,
        type: 'GENERIC',
        fileName: file.originalname,
        fileUrl: toPublicFileUrl(file.filename),
        fileSize: BigInt(file.size),
      },
    })

    return {
      id: attachment.id,
      applicationId: attachment.applicationId,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize ? Number(attachment.fileSize) : 0,
      fileUrl: attachment.fileUrl,
      mimeType: null,
      uploadedAt: attachment.uploadedAt.toISOString(),
    }
  },

  async removeAttachment(applicationId: string, userId: string, attachmentId: string) {
    const app = await prisma.activityApplication.findUnique({ where: { id: applicationId } })
    if (!app) throw notFound('立项申请不存在')
    if (app.applicantId !== userId) throw badRequest('无权删除该附件')

    await prisma.applicationAttachment.delete({ where: { id: attachmentId } })
  },

  async submitApplication(applicationId: string, applicantId: string) {
    const app = await prisma.activityApplication.findUnique({
      where: { id: applicationId },
      include: { organization: true },
    })
    if (!app) throw notFound('立项申请不存在')
    if (app.applicantId !== applicantId) throw badRequest('Only the applicant can submit this.')
    if (app.status !== 'DRAFT' && app.status !== 'NEED_MORE') {
      throw badRequest(`Cannot submit application in ${app.status} status.`)
    }

    const orgChain = await approvalService.resolveApprovalOrganizations(app.organizationId)
    const firstOrgId = orgChain[0]
    if (!firstOrgId) throw badRequest('无法确定审核组织')
    const firstReviewer = await approvalService.findReviewerByOrganization(firstOrgId)
    if (!firstReviewer) throw badRequest('未找到可用审核人')

    const updated = await prisma.activityApplication.update({
      where: { id: applicationId },
      data: {
        status: 'APPROVING',
        submittedAt: new Date(),
        currentLevel: 1,
        currentReviewerId: firstReviewer.id,
      },
      include: { organization: true, applicant: true, attachments: true },
    })

    await pendingTasksService.createPendingTask({
      assigneeId: firstReviewer.id,
      taskType: 'APPLICATION_REVIEW',
      relatedResourceType: 'ACTIVITY_APPLICATION',
      relatedResourceId: updated.id,
      title: `立项审核: ${updated.title}`,
      createdBy: applicantId,
    })

    await createSystemLog({
      userId: applicantId,
      action: 'ACTIVITY_APPLICATION_SUBMIT',
      resourceType: 'activity_application',
      resourceId: updated.id,
    })

    return toDto(updated)
  },

  async getApprovalRecords(applicationId: string) {
    const records = await prisma.approvalRecord.findMany({
      where: { activityApplicationId: applicationId },
      include: { reviewer: true, reviewerOrganization: true },
      orderBy: { reviewedAt: 'asc' },
    })

    return records.map((record) => ({
      id: record.id,
      applicationId: record.activityApplicationId,
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
