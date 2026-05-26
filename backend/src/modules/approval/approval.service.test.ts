import { beforeEach, describe, expect, it } from 'vitest'
import prisma from '../../shared/prisma/client.js'
import { approvalService } from './approval.service.js'

async function resetDb() {
  await prisma.approvalRecord.deleteMany()
  await prisma.notificationReceipt.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.pendingTask.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.applicationAttachment.deleteMany()
  await prisma.activityApplication.deleteMany()
  await prisma.userOrganization.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.role.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()
}

describe('approvalService', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('resolves approval organization chain by parent', async () => {
    const root = await prisma.organization.create({
      data: {
        orgCode: 'ROOT',
        name: 'Root',
        type: 'ADMINISTRATION',
        status: 'ACTIVE',
      },
    })

    const parent = await prisma.organization.create({
      data: {
        orgCode: 'PARENT',
        name: 'Parent',
        type: 'ADMINISTRATION',
        status: 'ACTIVE',
        parentOrgId: root.id,
      },
    })

    const child = await prisma.organization.create({
      data: {
        orgCode: 'CHILD',
        name: 'Child',
        type: 'CLUB',
        status: 'ACTIVE',
        parentOrgId: parent.id,
      },
    })

    const chain = await approvalService.resolveApprovalOrganizations(child.id)
    expect(chain[0]).toBe(parent.id)
    expect(chain[1]).toBe(root.id)
  })

  it('approves final review and creates activity', async () => {
    const role = await prisma.role.create({
      data: { code: 'REVIEWER', name: 'Reviewer' },
    })

    const root = await prisma.organization.create({
      data: {
        orgCode: 'ROOT',
        name: 'Root',
        type: 'ADMINISTRATION',
        status: 'ACTIVE',
      },
    })

    const applicant = await prisma.user.create({
      data: {
        username: 'applicant',
        realName: 'Applicant',
        passwordHash: 'hash',
        userType: 'STUDENT',
        status: 'ACTIVE',
      },
    })

    const reviewer = await prisma.user.create({
      data: {
        username: 'reviewer',
        realName: 'Reviewer',
        passwordHash: 'hash',
        userType: 'TEACHER',
        status: 'ACTIVE',
        userRoles: { create: [{ roleId: role.id }] },
        userOrganizations: { create: [{ organizationId: root.id }] },
      },
    })

    const application = await prisma.activityApplication.create({
      data: {
        applicantId: applicant.id,
        organizationId: root.id,
        title: 'Test Activity',
        summary: 'Summary',
        status: 'APPROVING',
        currentLevel: 1,
        currentReviewerId: reviewer.id,
        submittedAt: new Date(),
      },
    })

    const updated = await approvalService.reviewActivityApplication(reviewer.id, application.id, {
      decision: 'APPROVE',
    })

    expect(updated.status).toBe('APPROVED')

    const activity = await prisma.activity.findUnique({
      where: { applicationId: application.id },
    })

    expect(activity).not.toBeNull()
  })
})
