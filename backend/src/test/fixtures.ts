import request from 'supertest'
import type { Application } from 'express'
import type { Activity, ActivityStatus, Organization, OrganizationType, Role } from '@prisma/client'

import { createApp } from '../app.js'
import prisma from '../shared/prisma/client.js'

export type RoleCode = 'BASIC_USER' | 'ORGANIZER' | 'REVIEWER' | 'SYS_ADMIN'

export type RegisterTestUserInput = {
  username: string
  userType: 'student' | 'teacher'
  realName: string
}

export type RegisteredTestUser = {
  id: string
  username: string
  accessToken: string
}

export type CreateTestOrganizationInput = {
  orgCode: string
  name: string
  type: OrganizationType
}

export type CreateTestActivityInput = {
  organizerId: string
  organizationId: string
  title: string
  status: ActivityStatus
}

export async function cleanupTestData(): Promise<void> {
  await prisma.notificationReceipt.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.systemLog.deleteMany()
  await prisma.pendingTask.deleteMany()
  await prisma.checkinRecord.deleteMany()
  await prisma.checkinSession.deleteMany()
  await prisma.signupAttachment.deleteMany()
  await prisma.recruitmentSignup.deleteMany()
  await prisma.recruitmentAllowedMajor.deleteMany()
  await prisma.recruitment.deleteMany()
  await prisma.closureAttachment.deleteMany()
  await prisma.closureReviewRecord.deleteMany()
  await prisma.closureApplication.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.approvalRecord.deleteMany()
  await prisma.applicationAttachment.deleteMany()
  await prisma.roleApplication.deleteMany()
  await prisma.activityApplication.deleteMany()
  await prisma.userOrganization.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.studentProfile.deleteMany()
  await prisma.teacherProfile.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()
}

export async function ensureRole(code: RoleCode): Promise<Role> {
  return prisma.role.upsert({
    where: { code },
    update: {},
    create: { code, name: code },
  })
}

export async function ensureCoreRoles(): Promise<void> {
  await ensureRole('BASIC_USER')
  await ensureRole('ORGANIZER')
  await ensureRole('REVIEWER')
  await ensureRole('SYS_ADMIN')
}

export async function registerTestUser(
  input: RegisterTestUserInput
): Promise<RegisteredTestUser> {
  const app: Application = createApp()
  const response = await request(app).post('/api/v1/auth/register').send({
    username: input.username,
    password: 'Password123!',
    userType: input.userType,
    realName: input.realName,
  })

  if (response.status !== 201) {
    throw new Error(`Failed to create test user ${input.username}: ${response.text}`)
  }

  return {
    id: response.body.data.user.id as string,
    username: response.body.data.user.username as string,
    accessToken: response.body.data.accessToken as string,
  }
}

export async function createTestOrganization(
  input: CreateTestOrganizationInput
): Promise<Organization> {
  return prisma.organization.create({
    data: {
      orgCode: input.orgCode,
      name: input.name,
      type: input.type,
      status: 'ACTIVE',
    },
  })
}

export async function createTestActivity(
  input: CreateTestActivityInput
): Promise<Activity> {
  const application = await prisma.activityApplication.create({
    data: {
      applicantId: input.organizerId,
      organizationId: input.organizationId,
      title: `${input.title} 立项`,
      summary: `${input.title} 测试立项`,
      startTime: new Date('2026-06-01T01:00:00.000Z'),
      endTime: new Date('2026-06-01T03:00:00.000Z'),
      status: 'APPROVED',
    },
  })

  return prisma.activity.create({
    data: {
      applicationId: application.id,
      title: input.title,
      organizerId: input.organizerId,
      organizationId: input.organizationId,
      startTime: new Date('2026-06-01T01:00:00.000Z'),
      endTime: new Date('2026-06-01T03:00:00.000Z'),
      status: input.status,
    },
  })
}

export async function assignUserToOrganization(
  userId: string,
  organizationId: string
): Promise<void> {
  await prisma.userOrganization.upsert({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    update: {},
    create: {
      userId,
      organizationId,
    },
  })
}

export async function grantRole(userId: string, code: RoleCode): Promise<void> {
  const role = await ensureRole(code)
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId,
      roleId: role.id,
    },
  })
}
