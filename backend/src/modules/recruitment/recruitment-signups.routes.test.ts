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
})
