import request from 'supertest'
import type { Application } from 'express'
import type { Organization, OrganizationType, Role } from '@prisma/client'

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

export async function cleanupTestData(): Promise<void> {
  await prisma.pendingTask.deleteMany()
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
