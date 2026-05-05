import prisma from '../../shared/prisma/client.js'
import { notFound, badRequest, forbidden } from '../../shared/errors/app-error.js'

export const adminService = {
  async submitRoleApplication(userId: string, data: { targetRoleCode: string, organizationId?: string, reason?: string }) {
    // Basic rules from docs: REVIEWER must be teacher
    if (data.targetRoleCode === 'REVIEWER') {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user?.userType !== 'TEACHER') {
        throw badRequest('REVIEWER role can only be requested by teachers.')
      }
    }

    if (['REVIEWER', 'ORGANIZER'].includes(data.targetRoleCode) && !data.organizationId) {
      throw badRequest('Organization ID is required when applying for REVIEWER or ORGANIZER.')
    }

    return await prisma.roleApplication.create({
      data: {
        applicantId: userId,
        targetRoleCode: data.targetRoleCode,
        organizationId: data.organizationId,
        reason: data.reason,
        status: 'SUBMITTED', // Or APPROVING based on business logic, let's use SUBMITTED
        submittedAt: new Date(),
      },
    })
  },

  async reviewRoleApplication(reviewerId: string, applicationId: string, data: { result: 'APPROVED' | 'REJECTED', reviewComment?: string }) {
    const application = await prisma.roleApplication.findUnique({
      where: { id: applicationId },
      include: { applicant: true },
    })

    if (!application) {
      throw notFound('Role application not found.')
    }

    if (application.status !== 'SUBMITTED' && application.status !== 'APPROVING' && application.status !== 'DRAFT') {
      throw badRequest(`Cannot review application in ${application.status} status.`)
    }

    const { result, reviewComment } = data
    
    // Start a transaction for approval
    await prisma.$transaction(async (tx) => {
      // Update app status
      await tx.roleApplication.update({
        where: { id: applicationId },
        data: {
          status: result,
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
          reviewComment,
        },
      })

      if (result === 'APPROVED') {
        const role = await tx.role.findUnique({ where: { code: application.targetRoleCode } })
        if (!role) throw badRequest(`Role ${application.targetRoleCode} does not exist in DB.`)

        // Check if user already has the role
        const existingRole = await tx.userRole.findFirst({
          where: { userId: application.applicantId, roleId: role.id }
        })

        if (!existingRole) {
          await tx.userRole.create({
            data: { userId: application.applicantId, roleId: role.id }
          })
        }

        // If organization was specified, assign user to organization
        if (application.organizationId) {
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

    return { message: 'Role application reviewed successfully.' }
  },

  async getRoleApplications(status?: import('@prisma/client').RoleApplicationStatus) {
    const where = status ? { status } : {}
    return await prisma.roleApplication.findMany({
      where,
      include: {
        applicant: { select: { id: true, username: true, realName: true, userType: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
