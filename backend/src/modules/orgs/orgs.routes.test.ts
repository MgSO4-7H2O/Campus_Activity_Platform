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

describe('Organization APIs', () => {
  beforeAll(async () => {
    await ensureCoreRoles()
  })

  beforeEach(async () => {
    await cleanupTestData()
    await ensureCoreRoles()
  })

  it('lists organizations, returns tree, and reads detail', async () => {
    const parent = await createTestOrganization({
      orgCode: 'TEST_ORG_PARENT',
      name: '测试父组织',
      type: 'ADMINISTRATION',
    })
    const child = await prisma.organization.create({
      data: {
        orgCode: 'TEST_ORG_CHILD',
        name: '测试子组织',
        type: 'CLUB',
        parentOrgId: parent.id,
        status: 'ACTIVE',
      },
    })

    const listRes = await request(createApp()).get('/api/v1/organizations').query({ type: 'club' })

    expect(listRes.status).toBe(200)
    expect(listRes.body.data).toHaveLength(1)
    expect(listRes.body.data[0].id).toBe(child.id)

    const treeRes = await request(createApp()).get('/api/v1/organizations/tree')

    expect(treeRes.status).toBe(200)
    expect(treeRes.body.data[0].id).toBe(parent.id)
    expect(treeRes.body.data[0].children[0].id).toBe(child.id)

    const detailRes = await request(createApp()).get(`/api/v1/organizations/${child.id}`)

    expect(detailRes.status).toBe(200)
    expect(detailRes.body.data.name).toBe('测试子组织')
    expect(detailRes.body.data.parentOrgId).toBe(parent.id)
  })

  it('creates, updates, binds, lists, and unbinds organization membership as SYS_ADMIN', async () => {
    const admin = await registerTestUser({
      username: 'org_admin',
      userType: 'teacher',
      realName: '组织管理员',
    })
    await grantRole(admin.id, 'SYS_ADMIN')
    const target = await registerTestUser({
      username: 'org_target',
      userType: 'student',
      realName: '组织目标用户',
    })

    const createRes = await request(createApp())
      .post('/api/v1/admin/organizations')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: '新建测试组织',
        type: 'club',
        description: '组织接口测试',
      })

    expect(createRes.status).toBe(201)
    expect(createRes.body.data.name).toBe('新建测试组织')
    expect(createRes.body.data.type).toBe('club')

    const updateRes = await request(createApp())
      .patch(`/api/v1/admin/organizations/${createRes.body.data.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: '更新测试组织',
        status: 'DISABLED',
      })

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.data.name).toBe('更新测试组织')
    expect(updateRes.body.data.status).toBe('DISABLED')

    const bindRes = await request(createApp())
      .post(`/api/v1/admin/users/${target.id}/organizations`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        organizationId: createRes.body.data.id,
        role: 'MEMBER',
      })

    expect(bindRes.status).toBe(201)
    expect(bindRes.body.data.organizationName).toBe('更新测试组织')

    const listRes = await request(createApp())
      .get(`/api/v1/admin/users/${target.id}/organizations`)
      .set('Authorization', `Bearer ${admin.accessToken}`)

    expect(listRes.status).toBe(200)
    expect(listRes.body.data).toHaveLength(1)

    const unbindRes = await request(createApp())
      .delete(`/api/v1/admin/users/${target.id}/organizations/${createRes.body.data.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)

    expect(unbindRes.status).toBe(204)

    const membership = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: target.id,
          organizationId: createRes.body.data.id,
        },
      },
    })
    expect(membership).toBeNull()
  })

  it('rejects duplicate organization membership and missing membership removal', async () => {
    const admin = await registerTestUser({
      username: 'org_edge_admin',
      userType: 'teacher',
      realName: '组织边界管理员',
    })
    await grantRole(admin.id, 'SYS_ADMIN')
    const target = await registerTestUser({
      username: 'org_edge_target',
      userType: 'student',
      realName: '组织边界用户',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_ORG_EDGE',
      name: '组织边界测试',
      type: 'CLUB',
    })

    const firstBindRes = await request(createApp())
      .post(`/api/v1/admin/users/${target.id}/organizations`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ organizationId: organization.id, role: 'MEMBER' })
    const duplicateBindRes = await request(createApp())
      .post(`/api/v1/admin/users/${target.id}/organizations`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ organizationId: organization.id, role: 'MEMBER' })

    expect(firstBindRes.status).toBe(201)
    expect(duplicateBindRes.status).toBe(400)
    expect(duplicateBindRes.body.error.code).toBe('BAD_REQUEST')

    await request(createApp())
      .delete(`/api/v1/admin/users/${target.id}/organizations/${organization.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)

    const missingRemovalRes = await request(createApp())
      .delete(`/api/v1/admin/users/${target.id}/organizations/${organization.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)

    expect(missingRemovalRes.status).toBe(404)
    expect(missingRemovalRes.body.error.code).toBe('NOT_FOUND')
  })

  it('rejects organization admin writes from a non-admin user', async () => {
    const user = await registerTestUser({
      username: 'org_basic',
      userType: 'student',
      realName: '普通组织用户',
    })

    const res = await request(createApp())
      .post('/api/v1/admin/organizations')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        name: '无权组织',
        type: 'club',
      })

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})
