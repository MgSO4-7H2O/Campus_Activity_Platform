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

describe('Checkin APIs', () => {
  beforeAll(async () => {
    await ensureCoreRoles()
  })

  beforeEach(async () => {
    await cleanupTestData()
    await ensureCoreRoles()
  })

  it('opens a code session and records approved participant checkin', async () => {
    const organizer = await registerTestUser({
      username: 'checkin_organizer',
      userType: 'student',
      realName: '签到负责人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const participant = await registerTestUser({
      username: 'checkin_participant',
      userType: 'student',
      realName: '签到参与人',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_CHECKIN_ORG',
      name: '签到测试组织',
      type: 'CLUB',
    })
    const activity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '签到测试活动',
      status: 'ONGOING',
    })
    const recruitment = await prisma.recruitment.create({
      data: {
        activityId: activity.id,
        title: '签到测试招募',
        quota: 30,
        signupStartTime: new Date('2026-01-01T00:00:00.000Z'),
        signupEndTime: new Date('2027-01-01T00:00:00.000Z'),
        targetUserType: 'STUDENT',
        requiresAttachment: false,
        status: 'PUBLISHED',
      },
    })
    await prisma.recruitmentSignup.create({
      data: {
        recruitmentId: recruitment.id,
        userId: participant.id,
        status: 'APPROVED',
        reviewedBy: organizer.id,
        reviewedAt: new Date(),
      },
    })

    const createRes = await request(createApp())
      .post('/api/v1/checkin-sessions')
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        activityId: activity.id,
        title: '第一次签到',
        method: 'CODE',
        startAt: '2026-01-01T00:00:00.000Z',
        endAt: '2027-01-01T00:00:00.000Z',
      })

    expect(createRes.status).toBe(201)
    expect(createRes.body.data.status).toBe('DRAFT')
    expect(createRes.body.data.code).toMatch(/^\d{6}$/)

    const openRes = await request(createApp())
      .post(`/api/v1/checkin-sessions/${createRes.body.data.id}/open`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)

    expect(openRes.status).toBe(200)
    expect(openRes.body.data.status).toBe('OPEN')
    expect(openRes.body.data.totalCount).toBe(1)

    const checkinRes = await request(createApp())
      .post(`/api/v1/checkin-sessions/${createRes.body.data.id}/checkin`)
      .set('Authorization', `Bearer ${participant.accessToken}`)
      .send({
        code: createRes.body.data.code,
      })

    expect(checkinRes.status).toBe(200)
    expect(checkinRes.body.data.userId).toBe(participant.id)
    expect(checkinRes.body.data.realName).toBe('签到参与人')

    const duplicateRes = await request(createApp())
      .post(`/api/v1/checkin-sessions/${createRes.body.data.id}/checkin`)
      .set('Authorization', `Bearer ${participant.accessToken}`)
      .send({
        code: createRes.body.data.code,
      })

    expect(duplicateRes.status).toBe(409)
    expect(duplicateRes.body.error.code).toBe('CONFLICT')

    const recordsRes = await request(createApp())
      .get(`/api/v1/checkin-sessions/${createRes.body.data.id}/records`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)

    expect(recordsRes.status).toBe(200)
    expect(recordsRes.body.data).toHaveLength(1)
    expect(recordsRes.body.data[0].userId).toBe(participant.id)
  })
})
