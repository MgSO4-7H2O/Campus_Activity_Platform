import request from 'supertest'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../../app.js'
import prisma from '../../shared/prisma/client.js'
import {
  cleanupTestData,
  createTestOrganization,
  ensureCoreRoles,
  grantRole,
  registerTestUser,
} from '../../test/fixtures.js'

describe('Role application APIs', () => {
  beforeAll(async () => {
    await ensureCoreRoles()
  })

  beforeEach(async () => {
    await cleanupTestData()
    await ensureCoreRoles()
  })

  it('rejects role application submission without authentication', async () => {
    const organization = await createTestOrganization({
      orgCode: 'TEST_ROLE_ORG_UNAUTH',
      name: '测试权限组织',
      type: 'CLUB',
    })

    const res = await request(createApp()).post('/api/v1/role-applications').send({
      appliedRole: 'ORGANIZER',
      organizationId: organization.id,
      reason: '申请成为活动负责人',
    })

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('creates organizer application and lists it for the applicant', async () => {
    const user = await registerTestUser({
      username: 'role_applicant',
      userType: 'student',
      realName: '权限申请用户',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_ROLE_ORG_CREATE',
      name: '测试社团',
      type: 'CLUB',
    })

    const createRes = await request(createApp())
      .post('/api/v1/role-applications')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        appliedRole: 'ORGANIZER',
        organizationId: organization.id,
        reason: '申请成为活动负责人',
      })

    expect(createRes.status).toBe(201)
    expect(createRes.body.data.appliedRole).toBe('ORGANIZER')
    expect(createRes.body.data.status).toBe('SUBMITTED')

    const listRes = await request(createApp())
      .get('/api/v1/role-applications/me')
      .set('Authorization', `Bearer ${user.accessToken}`)

    expect(listRes.status).toBe(200)
    expect(listRes.body.data).toHaveLength(1)
    expect(listRes.body.data[0].id).toBe(createRes.body.data.id)
    expect(listRes.body.data[0].organizationName).toBe('测试社团')
  })

  it('rejects reviewer application from a student user', async () => {
    const user = await registerTestUser({
      username: 'student_reviewer',
      userType: 'student',
      realName: '学生申请审核人',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_ROLE_ORG_REVIEWER',
      name: '测试审核组织',
      type: 'ADMINISTRATION',
    })

    const res = await request(createApp())
      .post('/api/v1/role-applications')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        appliedRole: 'REVIEWER',
        organizationId: organization.id,
        reason: '申请成为审核人',
      })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })

  it('rejects organizer application without organization binding', async () => {
    const user = await registerTestUser({
      username: 'org_without_bind',
      userType: 'student',
      realName: '缺少组织用户',
    })

    const res = await request(createApp())
      .post('/api/v1/role-applications')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        appliedRole: 'ORGANIZER',
        reason: '申请成为活动负责人',
      })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })

  it('approves organizer application and writes user role plus organization binding', async () => {
    const applicant = await registerTestUser({
      username: 'approved_organizer',
      userType: 'student',
      realName: '待批准负责人',
    })
    const admin = await registerTestUser({
      username: 'role_admin',
      userType: 'teacher',
      realName: '权限管理员',
    })
    await grantRole(admin.id, 'SYS_ADMIN')
    const organization = await createTestOrganization({
      orgCode: 'TEST_ROLE_ORG_APPROVE',
      name: '审批测试组织',
      type: 'CLUB',
    })

    const createRes = await request(createApp())
      .post('/api/v1/role-applications')
      .set('Authorization', `Bearer ${applicant.accessToken}`)
      .send({
        appliedRole: 'ORGANIZER',
        organizationId: organization.id,
        reason: '申请成为活动负责人',
      })

    const reviewRes = await request(createApp())
      .post(`/api/v1/role-applications/${createRes.body.data.id}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        decision: 'APPROVE',
        comment: '同意申请',
      })

    expect(reviewRes.status).toBe(200)
    expect(reviewRes.body.data.status).toBe('APPROVED')
    expect(reviewRes.body.data.reviewerId).toBe(admin.id)

    const organizerRole = await prisma.role.findUniqueOrThrow({
      where: { code: 'ORGANIZER' },
    })
    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: applicant.id,
          roleId: organizerRole.id,
        },
      },
    })
    const userOrganization = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: applicant.id,
          organizationId: organization.id,
        },
      },
    })

    expect(userRole).not.toBeNull()
    expect(userOrganization).not.toBeNull()
  })
})
