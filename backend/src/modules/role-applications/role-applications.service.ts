import prisma from '../../shared/prisma/client.js'
import { badRequest, notFound } from '../../shared/errors/app-error.js'
import { pendingTasksService } from '../pending-tasks/pending-tasks.service.js'
import { notificationsService } from '../notifications/notifications.service.js'
import { createSystemLog } from '../../shared/utils/system-log.js'
import type { CreateRoleApplicationBody, ReviewRoleApplicationBody } from './role-applications.schemas.js'

export const roleApplicationsService = {
  async createApplication(userId: string, data: CreateRoleApplicationBody) {
    if (data.appliedRole === 'REVIEWER') {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user?.userType !== 'TEACHER') {
        throw badRequest('REVIEWER role can only be requested by teachers.')
      }
    }

    if (['REVIEWER', 'ORGANIZER'].includes(data.appliedRole) && !data.organizationId) {
      throw badRequest('Organization ID is required when applying for REVIEWER or ORGANIZER.')
    }

    const application = await prisma.roleApplication.create({
      data: {
        applicantId: userId,
        targetRoleCode: data.appliedRole,
        organizationId: data.organizationId,
        reason: data.reason,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    })

    const admin = await prisma.user.findFirst({
      where: { userRoles: { some: { role: { code: 'SYS_ADMIN' } } } },
    })

    if (admin) {
      await pendingTasksService.createPendingTask({
        assigneeId: admin.id,
        taskType: 'ROLE_APPLICATION_REVIEW',
        relatedResourceType: 'ROLE_APPLICATION',
        relatedResourceId: application.id,
        title: `角色申请审核: ${data.appliedRole}`,
        createdBy: userId,
      })
    }

    await createSystemLog({
      userId,
      action: 'ROLE_APPLICATION_SUBMIT',
      resourceType: 'role_application',
      resourceId: application.id,
    })

    return this.getApplicationById(application.id)
  },

  async getMyApplications(userId: string) {
    const applications = await prisma.roleApplication.findMany({
      where: { applicantId: userId },
      include: {
        applicant: { select: { id: true, realName: true } },
        reviewer: { select: { id: true, realName: true } },
        organization: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return applications.map(app => ({
      id: app.id,
      applicantId: app.applicantId,
      applicantName: app.applicant?.realName || null,
      appliedRole: app.targetRoleCode,
      organizationId: app.organizationId,
      organizationName: app.organization?.name || null,
      reason: app.reason,
      status: app.status,
      reviewerId: app.reviewedBy,
      reviewerName: app.reviewer?.realName || null,
      reviewComment: app.reviewComment,
      submittedAt: app.submittedAt?.toISOString() || null,
      decisionAt: app.reviewedAt?.toISOString() || null,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    }))
  },

  async getApplicationById(id: string) {
    const app = await prisma.roleApplication.findUnique({
      where: { id },
      include: {
        applicant: { select: { id: true, realName: true } },
        reviewer: { select: { id: true, realName: true } },
        organization: { select: { id: true, name: true } }
      }
    })

    if (!app) {
      throw notFound('Role application not found')
    }

    return {
      id: app.id,
      applicantId: app.applicantId,
      applicantName: app.applicant?.realName || null,
      appliedRole: app.targetRoleCode,
      organizationId: app.organizationId,
      organizationName: app.organization?.name || null,
      reason: app.reason,
      status: app.status,
      reviewerId: app.reviewedBy,
      reviewerName: app.reviewer?.realName || null,
      reviewComment: app.reviewComment,
      submittedAt: app.submittedAt?.toISOString() || null,
      decisionAt: app.reviewedAt?.toISOString() || null,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    }
  },

  async reviewRoleApplication(reviewerId: string, applicationId: string, data: ReviewRoleApplicationBody) {
    const application = await prisma.roleApplication.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      throw notFound('Role application not found.')
    }

    if (!['SUBMITTED', 'APPROVING'].includes(application.status)) {
      throw badRequest(`Cannot review application in ${application.status} status.`)
    }

    const { decision, comment } = data
    const newStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'

    await prisma.$transaction(async (tx) => {
      await tx.roleApplication.update({
        where: { id: applicationId },
        data: {
          status: newStatus,
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
          reviewComment: comment,
        },
      })

      if (newStatus === 'APPROVED') {
        const role = await tx.role.findUnique({ where: { code: application.targetRoleCode } })
        if (!role) throw badRequest(`Role ${application.targetRoleCode} does not exist in DB.`)

        const existingRole = await tx.userRole.findFirst({
          where: { userId: application.applicantId, roleId: role.id }
        })

        if (!existingRole) {
          await tx.userRole.create({
            data: { userId: application.applicantId, roleId: role.id }
          })
        }

        if (application.organizationId && ['REVIEWER', 'ORGANIZER'].includes(application.targetRoleCode)) {
          const existingOrg = await tx.userOrganization.findFirst({
            where: { userId: application.applicantId, organizationId: application.organizationId }
          })
          if (!existingOrg) {
            await tx.userOrganization.create({
              data: { userId: application.applicantId, organizationId: application.organizationId }
            })
          }
        }
      }
    })

    await pendingTasksService.markTaskProcessedByResource({
      relatedResourceType: 'ROLE_APPLICATION',
      relatedResourceId: applicationId,
    })

    await notificationsService.notifyUsers([application.applicantId], {
      title: '权限申请审核结果',
      content: `你的权限申请已${newStatus === 'APPROVED' ? '通过' : '拒绝'}`,
      sourceType: 'ROLE_APPLICATION',
      sourceId: applicationId,
    })

    await createSystemLog({
      userId: reviewerId,
      action: 'ROLE_APPLICATION_REVIEW',
      resourceType: 'role_application',
      resourceId: applicationId,
      details: { decision: data.decision },
    })

    return this.getApplicationById(applicationId)
  }
}
