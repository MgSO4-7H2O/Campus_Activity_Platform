import prisma from '../../shared/prisma/client.js'
import { notFound, badRequest } from '../../shared/errors/app-error.js'

export const activityApplicationsService = {
  async createApplication(applicantId: string, data: any) {
    // Basic rules: must bind to organization. Handled by schema.
    return await prisma.activityApplication.create({
      data: {
        applicantId,
        organizationId: data.organizationId,
        title: data.title,
        summary: data.summary,
        location: data.location,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        status: 'DRAFT'
      }
    })
  },

  async updateApplication(applicationId: string, applicantId: string, data: any) {
    const app = await prisma.activityApplication.findUnique({ where: { id: applicationId } })
    if (!app) throw notFound('Application not found')
    if (app.applicantId !== applicantId) throw badRequest('Only the applicant can update this.')
    if (app.status !== 'DRAFT' && app.status !== 'NEED_MORE') {
      throw badRequest(`Cannot update application in ${app.status} status.`)
    }

    return await prisma.activityApplication.update({
      where: { id: applicationId },
      data: {
        organizationId: data.organizationId,
        title: data.title,
        summary: data.summary,
        location: data.location,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      }
    })
  },

  async submitApplication(applicationId: string, applicantId: string) {
    const app = await prisma.activityApplication.findUnique({ where: { id: applicationId } })
    if (!app) throw notFound('Application not found')
    if (app.applicantId !== applicantId) throw badRequest('Only the applicant can submit this.')
    if (app.status !== 'DRAFT' && app.status !== 'NEED_MORE') {
      throw badRequest(`Cannot submit application in ${app.status} status.`)
    }

    // Update status to SUBMITTED
    const updated = await prisma.activityApplication.update({
      where: { id: applicationId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date()
      }
    })

    // Auto-generate reviewer task.
    // In a real app, this parses the org tree to find the correct reviewer (teacher in parent org).
    // For this 5.15 version minimally run skeleton, we assign it to a placeholder or the first reviewer we find.
    // Or we leave assigneeId as some system default and let reviewers pull it.
    
    // Let's find any reviewer in the system for demonstration
    const firstReviewer = await prisma.user.findFirst({
        where: { userRoles: { some: { role: { code: 'REVIEWER' } } } }
    })

    if (firstReviewer) {
        await prisma.pendingTask.create({
            data: {
                assigneeId: firstReviewer.id,
                taskType: 'APPLICATION_REVIEW',
                relatedResourceType: 'ACTIVITY_APPLICATION',
                relatedResourceId: updated.id,
                title: `立项审核: ${updated.title}`,
                createdBy: applicantId,
            }
        })
    }

    return updated
  },

  async getMyApplications(applicantId: string) {
    return await prisma.activityApplication.findMany({
      where: { applicantId },
      orderBy: { createdAt: 'desc' }
    })
  }
}
