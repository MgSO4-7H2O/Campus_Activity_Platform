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

describe('Recruitment and signup APIs', () => {
  beforeAll(async () => {
    await ensureCoreRoles()
  })

  beforeEach(async () => {
    await cleanupTestData()
    await ensureCoreRoles()
  })

  it('creates and publishes a recruitment for an organizer activity', async () => {
    const organizer = await registerTestUser({
      username: 'recruit_organizer',
      userType: 'student',
      realName: '招募负责人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const organization = await createTestOrganization({
      orgCode: 'TEST_RECRUIT_ORG',
      name: '招募测试组织',
      type: 'CLUB',
    })
    const activity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '招募测试活动',
      status: 'PLANNED',
    })

    const createRes = await request(createApp())
      .post('/api/v1/recruitments')
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        activityId: activity.id,
        title: '招募测试活动报名',
        capacity: 20,
        registrationStart: '2026-01-01T00:00:00.000Z',
        registrationEnd: '2027-01-01T00:00:00.000Z',
        allowedUserTypes: ['STUDENT'],
        allowedGrades: ['2024', '2025'],
        allowedMajors: ['软件工程'],
        requiresAttachment: false,
      })

    expect(createRes.status).toBe(201)
    expect(createRes.body.data.status).toBe('DRAFT')
    expect(createRes.body.data.allowedMajors).toEqual(['软件工程'])

    const publishRes = await request(createApp())
      .post(`/api/v1/recruitments/${createRes.body.data.id}/publish`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)

    expect(publishRes.status).toBe(200)
    expect(publishRes.body.data.status).toBe('PUBLISHED')

    const activityAfterPublish = await prisma.activity.findUniqueOrThrow({
      where: { id: activity.id },
    })
    expect(activityAfterPublish.status).toBe('RECRUITING')

    const listRes = await request(createApp()).get('/api/v1/recruitments').query({
      status: 'PUBLISHED',
    })

    expect(listRes.status).toBe(200)
    expect(listRes.body.data[0].id).toBe(createRes.body.data.id)
  })

  it('updates and closes a draft recruitment by activity organizer', async () => {
    const organizer = await registerTestUser({
      username: 'recruit_edit_org',
      userType: 'student',
      realName: '招募编辑负责人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const organization = await createTestOrganization({
      orgCode: 'TEST_RECRUIT_EDIT_ORG',
      name: '招募编辑组织',
      type: 'CLUB',
    })
    const activity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '招募编辑活动',
      status: 'PLANNED',
    })
    const recruitment = await prisma.recruitment.create({
      data: {
        activityId: activity.id,
        title: '旧招募标题',
        quota: 5,
        signupStartTime: new Date('2026-01-01T00:00:00.000Z'),
        signupEndTime: new Date('2027-01-01T00:00:00.000Z'),
        targetUserType: 'STUDENT',
        requiresAttachment: false,
        status: 'DRAFT',
      },
    })

    const updateRes = await request(createApp())
      .patch(`/api/v1/recruitments/${recruitment.id}`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        title: '新招募标题',
        capacity: 12,
        registrationStart: '2026-02-01T00:00:00.000Z',
        registrationEnd: '2027-02-01T00:00:00.000Z',
        allowedUserTypes: ['STUDENT', 'TEACHER'],
        allowedGrades: ['2023', '2024'],
        allowedMajors: ['计算机科学'],
        requiresAttachment: true,
      })

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.data.title).toBe('新招募标题')
    expect(updateRes.body.data.capacity).toBe(12)
    expect(updateRes.body.data.allowedUserTypes).toEqual(['STUDENT', 'TEACHER'])
    expect(updateRes.body.data.allowedMajors).toEqual(['计算机科学'])

    const closeRes = await request(createApp())
      .post(`/api/v1/recruitments/${recruitment.id}/close`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)

    expect(closeRes.status).toBe(200)
    expect(closeRes.body.data.status).toBe('CLOSED')
  })

  it('rejects recruitment edits from non-owner user', async () => {
    const organizer = await registerTestUser({
      username: 'recruit_owner',
      userType: 'student',
      realName: '招募负责人本人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const otherUser = await registerTestUser({
      username: 'recruit_other',
      userType: 'student',
      realName: '招募其他用户',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_RECRUIT_FORBIDDEN_ORG',
      name: '招募权限组织',
      type: 'CLUB',
    })
    const activity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '招募权限活动',
      status: 'PLANNED',
    })
    const recruitment = await prisma.recruitment.create({
      data: {
        activityId: activity.id,
        title: '招募权限草稿',
        quota: 5,
        signupStartTime: new Date('2026-01-01T00:00:00.000Z'),
        signupEndTime: new Date('2027-01-01T00:00:00.000Z'),
        targetUserType: 'STUDENT',
        requiresAttachment: false,
        status: 'DRAFT',
      },
    })

    const res = await request(createApp())
      .patch(`/api/v1/recruitments/${recruitment.id}`)
      .set('Authorization', `Bearer ${otherUser.accessToken}`)
      .send({
        title: '越权招募标题',
        capacity: 8,
      })

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('creates a signup pending task and notifies the applicant after review', async () => {
    const organizer = await registerTestUser({
      username: 'signup_organizer',
      userType: 'student',
      realName: '报名负责人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const applicant = await registerTestUser({
      username: 'signup_applicant',
      userType: 'student',
      realName: '报名申请人',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_SIGNUP_ORG',
      name: '报名测试组织',
      type: 'CLUB',
    })
    const activity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '报名测试活动',
      status: 'RECRUITING',
    })
    const recruitment = await prisma.recruitment.create({
      data: {
        activityId: activity.id,
        title: '报名测试活动招募',
        quota: 10,
        signupStartTime: new Date('2026-01-01T00:00:00.000Z'),
        signupEndTime: new Date('2027-01-01T00:00:00.000Z'),
        targetUserType: 'STUDENT',
        requiresAttachment: false,
        status: 'PUBLISHED',
      },
    })

    const signupRes = await request(createApp())
      .post(`/api/v1/recruitments/${recruitment.id}/signups`)
      .set('Authorization', `Bearer ${applicant.accessToken}`)
      .send({})

    expect(signupRes.status).toBe(201)
    expect(signupRes.body.data.status).toBe('SUBMITTED')

    const pendingTask = await prisma.pendingTask.findFirstOrThrow({
      where: {
        assigneeId: organizer.id,
        relatedResourceType: 'RECRUITMENT_SIGNUP',
        relatedResourceId: signupRes.body.data.id,
      },
    })
    expect(pendingTask.taskType).toBe('SIGNUP_REVIEW')

    const reviewRes = await request(createApp())
      .post(`/api/v1/signups/${signupRes.body.data.id}/review`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        decision: 'APPROVE',
        comment: '同意报名',
      })

    expect(reviewRes.status).toBe(200)
    expect(reviewRes.body.data.status).toBe('APPROVED')

    const processedTask = await prisma.pendingTask.findUniqueOrThrow({
      where: { id: pendingTask.id },
    })
    expect(processedTask.status).toBe('PROCESSED')

    const unreadRes = await request(createApp())
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${applicant.accessToken}`)

    expect(unreadRes.status).toBe(200)
    expect(unreadRes.body.data.count).toBe(1)
  })

  it('prevents duplicate signup and lets applicant cancel own signup', async () => {
    const organizer = await registerTestUser({
      username: 'signup_cancel_org',
      userType: 'student',
      realName: '报名取消负责人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const applicant = await registerTestUser({
      username: 'signup_cancel_app',
      userType: 'student',
      realName: '报名取消申请人',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_SIGNUP_CANCEL_ORG',
      name: '报名取消组织',
      type: 'CLUB',
    })
    const activity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '报名取消活动',
      status: 'RECRUITING',
    })
    const recruitment = await prisma.recruitment.create({
      data: {
        activityId: activity.id,
        title: '报名取消招募',
        quota: 10,
        signupStartTime: new Date('2026-01-01T00:00:00.000Z'),
        signupEndTime: new Date('2027-01-01T00:00:00.000Z'),
        targetUserType: 'STUDENT',
        requiresAttachment: false,
        status: 'PUBLISHED',
      },
    })

    const signupRes = await request(createApp())
      .post(`/api/v1/recruitments/${recruitment.id}/signups`)
      .set('Authorization', `Bearer ${applicant.accessToken}`)
      .send({})

    expect(signupRes.status).toBe(201)

    const duplicateRes = await request(createApp())
      .post(`/api/v1/recruitments/${recruitment.id}/signups`)
      .set('Authorization', `Bearer ${applicant.accessToken}`)
      .send({})

    expect(duplicateRes.status).toBe(409)
    expect(duplicateRes.body.error.code).toBe('CONFLICT')

    const cancelRes = await request(createApp())
      .post(`/api/v1/signups/${signupRes.body.data.id}/cancel`)
      .set('Authorization', `Bearer ${applicant.accessToken}`)

    expect(cancelRes.status).toBe(200)
    expect(cancelRes.body.data.status).toBe('CANCELED')
  })

  it('rejects signup review from non-owner and supports organizer rejection', async () => {
    const organizer = await registerTestUser({
      username: 'signup_reject_org',
      userType: 'student',
      realName: '报名拒绝负责人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const otherUser = await registerTestUser({
      username: 'signup_reject_other',
      userType: 'student',
      realName: '报名拒绝其他用户',
    })
    const applicant = await registerTestUser({
      username: 'signup_reject_app',
      userType: 'student',
      realName: '报名拒绝申请人',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_SIGNUP_REJECT_ORG',
      name: '报名拒绝组织',
      type: 'CLUB',
    })
    const activity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '报名拒绝活动',
      status: 'RECRUITING',
    })
    const recruitment = await prisma.recruitment.create({
      data: {
        activityId: activity.id,
        title: '报名拒绝招募',
        quota: 10,
        signupStartTime: new Date('2026-01-01T00:00:00.000Z'),
        signupEndTime: new Date('2027-01-01T00:00:00.000Z'),
        targetUserType: 'STUDENT',
        requiresAttachment: false,
        status: 'PUBLISHED',
      },
    })
    const signupRes = await request(createApp())
      .post(`/api/v1/recruitments/${recruitment.id}/signups`)
      .set('Authorization', `Bearer ${applicant.accessToken}`)
      .send({})

    const forbiddenRes = await request(createApp())
      .post(`/api/v1/signups/${signupRes.body.data.id}/review`)
      .set('Authorization', `Bearer ${otherUser.accessToken}`)
      .send({
        decision: 'REJECT',
        comment: '无权审核',
      })

    expect(forbiddenRes.status).toBe(403)
    expect(forbiddenRes.body.error.code).toBe('FORBIDDEN')

    const rejectRes = await request(createApp())
      .post(`/api/v1/signups/${signupRes.body.data.id}/review`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        decision: 'REJECT',
        comment: '名额不匹配',
      })

    expect(rejectRes.status).toBe(200)
    expect(rejectRes.body.data.status).toBe('REJECTED')
  })
})
