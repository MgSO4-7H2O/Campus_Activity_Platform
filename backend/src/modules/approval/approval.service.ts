import prisma from '../../shared/prisma/client.js'
import { badRequest, notFound } from '../../shared/errors/app-error.js'
import { pendingTasksService } from '../pending-tasks/pending-tasks.service.js'
import { notificationsService } from '../notifications/notifications.service.js'
import { createSystemLog } from '../../shared/utils/system-log.js'
import { assertUserHasAnyRole } from '../../shared/auth/roles.js'

function toActivityApplicationDto(app: any) {
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

async function resolveApprovalOrganizations(applicantOrgId: string) {
  const org = await prisma.organization.findUnique({ where: { id: applicantOrgId } })
  if (!org) return []

  const chain: string[] = []
  if (org.parentOrgId) chain.push(org.parentOrgId)

  if (org.parentOrgId) {
    const parent = await prisma.organization.findUnique({ where: { id: org.parentOrgId } })
    if (parent?.parentOrgId) chain.push(parent.parentOrgId)
  }

  if (chain.length === 0) chain.push(org.id)

  return Array.from(new Set(chain)).slice(0, 2)
}

async function findReviewerByOrganization(orgId: string) {
  const reviewer = await prisma.user.findFirst({
    where: {
      userRoles: { some: { role: { code: 'REVIEWER' } } },
      userOrganizations: { some: { organizationId: orgId } },
    },
  })

  return reviewer
}

export const approvalService = {
  resolveApprovalOrganizations,
  findReviewerByOrganization,

  async getActivityApplication(applicationId: string) {
    const app = await prisma.activityApplication.findUnique({
      where: { id: applicationId },
      include: {
        organization: true,
        applicant: true,
        attachments: true,
      },
    })

    if (!app) throw notFound('活动立项不存在')
    return toActivityApplicationDto(app)
  },

  async reviewActivityApplication(reviewerId: string, applicationId: string, input: { decision: 'APPROVE' | 'REJECT' | 'NEED_MORE'; comment?: string }) {
    await assertUserHasAnyRole(reviewerId, ['REVIEWER', 'SYS_ADMIN'])
    const application = await prisma.activityApplication.findUnique({
      where: { id: applicationId },
      include: {
        organization: true,
        applicant: true,
        attachments: true,
      },
    })

    if (!application) throw notFound('活动立项不存在')
    if (!['APPROVING', 'SUBMITTED'].includes(application.status)) {
      throw badRequest(`当前状态不可审核: ${application.status}`)
    }

    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
      include: { userOrganizations: true },
    })
    if (!reviewer) throw notFound('审核人不存在')
    const reviewerOrgId = reviewer.userOrganizations[0]?.organizationId ?? application.organizationId

    const reviewDecision = input.decision
    const currentLevel = application.currentLevel ?? 1

    await prisma.$transaction(async (tx) => {
      await tx.approvalRecord.create({
        data: {
          activityApplicationId: applicationId,
          reviewerId,
          reviewerOrganizationId: reviewerOrgId,
          level: currentLevel,
          result: reviewDecision === 'APPROVE' ? 'APPROVED' : reviewDecision === 'REJECT' ? 'REJECTED' : 'NEED_MORE',
          comment: input.comment,
        },
      })

      await pendingTasksService.markTaskProcessedByResource({
        relatedResourceType: 'ACTIVITY_APPLICATION',
        relatedResourceId: applicationId,
      })

      if (reviewDecision === 'REJECT') {
        await tx.activityApplication.update({
          where: { id: applicationId },
          data: {
            status: 'REJECTED',
            currentReviewerId: null,
          },
        })
        return
      }

      if (reviewDecision === 'NEED_MORE') {
        await tx.activityApplication.update({
          where: { id: applicationId },
          data: {
            status: 'NEED_MORE',
            currentReviewerId: null,
          },
        })
        return
      }

      const orgChain = await resolveApprovalOrganizations(application.organizationId)
      const nextLevel = currentLevel + 1
      const nextOrgId = orgChain[nextLevel - 1]

      if (!nextOrgId) {
        await tx.activityApplication.update({
          where: { id: applicationId },
          data: {
            status: 'APPROVED',
            currentReviewerId: null,
            currentLevel: nextLevel,
          },
        })

        await tx.activity.create({
          data: {
            applicationId: applicationId,
            title: application.title,
            organizerId: application.applicantId,
            organizationId: application.organizationId,
            startTime: application.startTime,
            endTime: application.endTime,
            status: 'PLANNED',
          },
        })

        return
      }

      const nextReviewer = await findReviewerByOrganization(nextOrgId)
      if (!nextReviewer) {
        throw badRequest('未找到可用审核人')
      }

      await tx.activityApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVING',
          currentReviewerId: nextReviewer.id,
          currentLevel: nextLevel,
        },
      })

      await pendingTasksService.createPendingTask({
        assigneeId: nextReviewer.id,
        taskType: 'APPLICATION_REVIEW',
        relatedResourceType: 'ACTIVITY_APPLICATION',
        relatedResourceId: applicationId,
        title: `立项审核: ${application.title}`,
        createdBy: reviewerId,
      })
    })

    await createSystemLog({
      userId: reviewerId,
      action: 'ACTIVITY_APPLICATION_REVIEW',
      resourceType: 'activity_application',
      resourceId: applicationId,
      details: { decision: input.decision, level: currentLevel },
    })

    await notificationsService.notifyUsers([application.applicantId], {
      title: '立项审核结果更新',
      content: `你的立项申请已${input.decision === 'APPROVE' ? '通过' : input.decision === 'REJECT' ? '拒绝' : '退回补充材料'}`,
      sourceType: 'ACTIVITY_APPLICATION',
      sourceId: applicationId,
    })

    return this.getActivityApplication(applicationId)
  },
}
