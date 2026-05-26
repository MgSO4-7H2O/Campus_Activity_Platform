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

describe('Activity application APIs', () => {
  beforeAll(async () => {
    await ensureCoreRoles()
  })

  beforeEach(async () => {
    await cleanupTestData()
    await ensureCoreRoles()
  })

  it('rejects creating activity application without authentication', async () => {
    const organization = await createTestOrganization({
      orgCode: 'TEST_APP_ORG_UNAUTH',
      name: '未登录测试组织',
      type: 'CLUB',
    })

    const res = await request(createApp()).post('/api/v1/activity-applications').send({
      organizationId: organization.id,
      title: '未登录活动',
      summary: '未登录不能创建',
    })

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('creates a draft activity application for authenticated organizer', async () => {
    const user = await registerTestUser({
      username: 'activity_creator',
      userType: 'student',
      realName: '立项创建者',
    })
    await grantRole(user.id, 'ORGANIZER')
    const organization = await createTestOrganization({
      orgCode: 'TEST_APP_ORG_CREATE',
      name: '活动组织',
      type: 'CLUB',
    })

    const res = await request(createApp())
      .post('/api/v1/activity-applications')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        organizationId: organization.id,
        title: '测试立项活动',
        summary: '测试立项摘要',
        location: '测试教室',
        startTime: '2026-06-01T01:00:00.000Z',
        endTime: '2026-06-01T03:00:00.000Z',
      })

    expect(res.status).toBe(201)
    expect(res.body.data.title).toBe('测试立项活动')
    expect(res.body.data.status).toBe('DRAFT')
    expect(res.body.data.applicantId).toBe(user.id)
  })

  it('rejects invalid organization id while creating application', async () => {
    const user = await registerTestUser({
      username: 'activity_invalid_org',
      userType: 'student',
      realName: '非法组织用户',
    })

    const res = await request(createApp())
      .post('/api/v1/activity-applications')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        organizationId: 'not-a-uuid',
        title: '非法组织活动',
      })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('allows applicant to update a draft application', async () => {
    const user = await registerTestUser({
      username: 'activity_updater',
      userType: 'student',
      realName: '立项更新者',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_APP_ORG_UPDATE',
      name: '更新测试组织',
      type: 'CLUB',
    })
    const createRes = await request(createApp())
      .post('/api/v1/activity-applications')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        organizationId: organization.id,
        title: '原始标题',
      })

    const updateRes = await request(createApp())
      .put(`/api/v1/activity-applications/${createRes.body.data.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: '更新后的标题',
        summary: '更新后的摘要',
      })

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.data.title).toBe('更新后的标题')
    expect(updateRes.body.data.summary).toBe('更新后的摘要')
  })

  it('rejects update from non-applicant user', async () => {
    const owner = await registerTestUser({
      username: 'activity_owner',
      userType: 'student',
      realName: '立项所有者',
    })
    const other = await registerTestUser({
      username: 'activity_other',
      userType: 'student',
      realName: '其他用户',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_APP_ORG_NON_OWNER',
      name: '非本人测试组织',
      type: 'CLUB',
    })
    const createRes = await request(createApp())
      .post('/api/v1/activity-applications')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        organizationId: organization.id,
        title: '本人立项',
      })

    const updateRes = await request(createApp())
      .put(`/api/v1/activity-applications/${createRes.body.data.id}`)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .send({
        title: '越权修改',
      })

    expect(updateRes.status).toBe(400)
    expect(updateRes.body.error.code).toBe('BAD_REQUEST')
  })

  it('submits draft application and creates reviewer pending task', async () => {
    const applicant = await registerTestUser({
      username: 'activity_submitter',
      userType: 'student',
      realName: '立项提交者',
    })
    const reviewer = await registerTestUser({
      username: 'activity_reviewer',
      userType: 'teacher',
      realName: '立项审核人',
    })
    await grantRole(reviewer.id, 'REVIEWER')
    const organization = await createTestOrganization({
      orgCode: 'TEST_APP_ORG_SUBMIT',
      name: '提交测试组织',
      type: 'CLUB',
    })
    const createRes = await request(createApp())
      .post('/api/v1/activity-applications')
      .set('Authorization', `Bearer ${applicant.accessToken}`)
      .send({
        organizationId: organization.id,
        title: '待提交活动',
      })

    const submitRes = await request(createApp())
      .post(`/api/v1/activity-applications/${createRes.body.data.id}/submit`)
      .set('Authorization', `Bearer ${applicant.accessToken}`)

    expect(submitRes.status).toBe(200)
    expect(submitRes.body.data.status).toBe('SUBMITTED')
    expect(submitRes.body.data.submittedAt).toBeTruthy()

    const pendingTask = await prisma.pendingTask.findFirst({
      where: {
        assigneeId: reviewer.id,
        relatedResourceId: createRes.body.data.id,
        taskType: 'APPLICATION_REVIEW',
      },
    })

    expect(pendingTask?.relatedResourceType).toBe('ACTIVITY_APPLICATION')
    expect(pendingTask?.title).toBe('立项审核: 待提交活动')
  })
})
