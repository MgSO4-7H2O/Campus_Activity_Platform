import request from 'supertest'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../../app.js'
import prisma from '../../shared/prisma/client.js'
import {
  cleanupTestData,
  createTestActivity,
  createTestOrganization,
  ensureCoreRoles,
  grantRole,
  registerTestUser,
} from '../../test/fixtures.js'

describe('Admin APIs', () => {
  beforeAll(async () => {
    await ensureCoreRoles()
  })

  beforeEach(async () => {
    await cleanupTestData()
    await ensureCoreRoles()
  })

  it('rejects user management from a non-admin user', async () => {
    const user = await registerTestUser({
      username: 'admin_forbidden_user',
      userType: 'student',
      realName: '普通后台用户',
    })

    const res = await request(createApp())
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${user.accessToken}`)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('lists users, reads detail, and updates user status as SYS_ADMIN', async () => {
    const admin = await registerTestUser({
      username: 'admin_manager',
      userType: 'teacher',
      realName: '后台管理员',
    })
    await grantRole(admin.id, 'SYS_ADMIN')
    const target = await registerTestUser({
      username: 'admin_target',
      userType: 'student',
      realName: '后台目标用户',
    })
    await grantRole(target.id, 'ORGANIZER')
    const organization = await createTestOrganization({
      orgCode: 'TEST_ADMIN_USER_ORG',
      name: '后台用户组织',
      type: 'CLUB',
    })
    await prisma.userOrganization.create({
      data: {
        userId: target.id,
        organizationId: organization.id,
      },
    })

    const listRes = await request(createApp())
      .get('/api/v1/admin/users')
      .query({ keyword: 'admin_target', role: 'ORGANIZER' })
      .set('Authorization', `Bearer ${admin.accessToken}`)

    expect(listRes.status).toBe(200)
    expect(listRes.body.data).toHaveLength(1)
    expect(listRes.body.data[0].username).toBe('admin_target')
    expect(listRes.body.data[0].roles).toContain('ORGANIZER')
    expect(listRes.body.data[0].organizations[0].name).toBe('后台用户组织')

    const detailRes = await request(createApp())
      .get(`/api/v1/admin/users/${target.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)

    expect(detailRes.status).toBe(200)
    expect(detailRes.body.data.id).toBe(target.id)
    expect(detailRes.body.data.status).toBe('ACTIVE')

    const statusRes = await request(createApp())
      .patch(`/api/v1/admin/users/${target.id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'DISABLED' })

    expect(statusRes.status).toBe(200)
    expect(statusRes.body.data.status).toBe('DISABLED')

    const disabledUser = await prisma.user.findUniqueOrThrow({
      where: { id: target.id },
    })
    expect(disabledUser.status).toBe('BANNED')
  })

  it('returns dashboard counts and system logs for SYS_ADMIN', async () => {
    const admin = await registerTestUser({
      username: 'admin_dashboard',
      userType: 'teacher',
      realName: '后台看板管理员',
    })
    await grantRole(admin.id, 'SYS_ADMIN')
    const organizer = await registerTestUser({
      username: 'admin_dash_org',
      userType: 'student',
      realName: '后台看板负责人',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_ADMIN_DASHBOARD_ORG',
      name: '后台看板组织',
      type: 'CLUB',
    })
    await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '后台看板活动',
      status: 'ONGOING',
    })
    await prisma.systemLog.create({
      data: {
        userId: admin.id,
        action: 'ADMIN_TEST_ACTION',
        resourceType: 'admin_test',
        resourceId: admin.id,
      },
    })

    const dashboardRes = await request(createApp())
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${admin.accessToken}`)

    expect(dashboardRes.status).toBe(200)
    expect(dashboardRes.body.data.userCount).toBe(2)
    expect(dashboardRes.body.data.activeActivityCount).toBe(1)

    const logsRes = await request(createApp())
      .get('/api/v1/admin/system-logs')
      .query({ action: 'ADMIN_TEST_ACTION' })
      .set('Authorization', `Bearer ${admin.accessToken}`)

    expect(logsRes.status).toBe(200)
    expect(logsRes.body.data).toHaveLength(1)
    expect(logsRes.body.data[0].action).toBe('ADMIN_TEST_ACTION')
  })
})
