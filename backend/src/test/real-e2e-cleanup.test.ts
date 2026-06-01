import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import prisma from '../shared/prisma/client.js'
import { cleanupRealE2EUser } from './real-e2e-cleanup.js'
import { cleanupTestData, ensureCoreRoles, registerTestUser } from './fixtures.js'

describe('cleanupRealE2EUser', () => {
  beforeEach(async () => {
    await cleanupTestData()
    await ensureCoreRoles()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('删除真实 E2E 创建的用户及其学生 profile', async () => {
    const user = await registerTestUser({
      username: 'realcleanupuser',
      userType: 'student',
      realName: '真实联调清理用户',
    })

    await prisma.studentProfile.update({
      where: { userId: user.id },
      data: {
        college: '真实联调学院',
        major: '软件工程',
        grade: 2026,
        className: '联调2601',
      },
    })

    await cleanupRealE2EUser(user.username)

    const deletedUser = await prisma.user.findUnique({ where: { username: user.username } })
    const deletedProfile = await prisma.studentProfile.findUnique({ where: { userId: user.id } })

    expect(deletedUser).toBeNull()
    expect(deletedProfile).toBeNull()
  })

  it('删除真实 E2E 主链路创建的组织、权限申请、立项申请、待办和活动', async () => {
    const user = await registerTestUser({
      username: 'realflowcleanup',
      userType: 'student',
      realName: '真实联调主链路清理用户',
    })
    const organization = await prisma.organization.create({
      data: {
        orgCode: 'REAL_FLOW_CLEANUP',
        name: `真实联调组织-${user.username}`,
        type: 'CLUB',
        status: 'ACTIVE',
      },
    })
    const roleApplication = await prisma.roleApplication.create({
      data: {
        applicantId: user.id,
        targetRoleCode: 'ORGANIZER',
        organizationId: organization.id,
        reason: '真实联调权限申请清理验证',
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    })
    const activityApplication = await prisma.activityApplication.create({
      data: {
        applicantId: user.id,
        organizationId: organization.id,
        title: '真实联调活动清理验证',
        summary: '真实联调活动清理验证',
        startTime: new Date('2026-06-01T01:00:00.000Z'),
        endTime: new Date('2026-06-01T03:00:00.000Z'),
        status: 'APPROVED',
      },
    })
    const activity = await prisma.activity.create({
      data: {
        applicationId: activityApplication.id,
        title: activityApplication.title,
        organizerId: user.id,
        organizationId: organization.id,
        startTime: activityApplication.startTime,
        endTime: activityApplication.endTime,
        status: 'PLANNED',
      },
    })
    await prisma.pendingTask.createMany({
      data: [
        {
          assigneeId: user.id,
          taskType: 'ROLE_APPLICATION_REVIEW',
          relatedResourceType: 'ROLE_APPLICATION',
          relatedResourceId: roleApplication.id,
          title: '真实联调权限待办清理验证',
          createdBy: user.id,
        },
        {
          assigneeId: user.id,
          taskType: 'APPLICATION_REVIEW',
          relatedResourceType: 'ACTIVITY_APPLICATION',
          relatedResourceId: activityApplication.id,
          title: '真实联调立项待办清理验证',
          createdBy: user.id,
        },
      ],
    })

    await cleanupRealE2EUser(user.username)

    await expect(prisma.user.findUnique({ where: { id: user.id } })).resolves.toBeNull()
    await expect(prisma.organization.findUnique({ where: { id: organization.id } })).resolves.toBeNull()
    await expect(prisma.roleApplication.findUnique({ where: { id: roleApplication.id } })).resolves.toBeNull()
    await expect(prisma.activityApplication.findUnique({ where: { id: activityApplication.id } })).resolves.toBeNull()
    await expect(prisma.activity.findUnique({ where: { id: activity.id } })).resolves.toBeNull()
    await expect(prisma.pendingTask.count()).resolves.toBe(0)
  })
})
