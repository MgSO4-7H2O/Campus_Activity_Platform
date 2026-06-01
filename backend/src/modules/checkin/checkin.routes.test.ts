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

  it('rejects invalid checkin states and supports close plus manual records', async () => {
    const organizer = await registerTestUser({
      username: 'checkin_guard_org',
      userType: 'student',
      realName: '签到保护负责人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const participant = await registerTestUser({
      username: 'checkin_guard_user',
      userType: 'student',
      realName: '签到保护参与人',
    })
    const outsider = await registerTestUser({
      username: 'checkin_guard_out',
      userType: 'student',
      realName: '签到保护未报名用户',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_CHECKIN_GUARD_ORG',
      name: '签到保护组织',
      type: 'CLUB',
    })
    const activity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '签到保护活动',
      status: 'ONGOING',
    })
    const recruitment = await prisma.recruitment.create({
      data: {
        activityId: activity.id,
        title: '签到保护招募',
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
        title: '保护签到',
        method: 'CODE',
        startAt: '2026-01-01T00:00:00.000Z',
        endAt: '2027-01-01T00:00:00.000Z',
      })

    const pendingCheckinRes = await request(createApp())
      .post(`/api/v1/checkin-sessions/${createRes.body.data.id}/checkin`)
      .set('Authorization', `Bearer ${participant.accessToken}`)
      .send({ code: createRes.body.data.code })

    expect(pendingCheckinRes.status).toBe(400)
    expect(pendingCheckinRes.body.error.code).toBe('BAD_REQUEST')

    await request(createApp())
      .post(`/api/v1/checkin-sessions/${createRes.body.data.id}/open`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)

    const wrongCodeRes = await request(createApp())
      .post(`/api/v1/checkin-sessions/${createRes.body.data.id}/checkin`)
      .set('Authorization', `Bearer ${participant.accessToken}`)
      .send({ code: '000000' })

    expect(wrongCodeRes.status).toBe(400)
    expect(wrongCodeRes.body.error.code).toBe('BAD_REQUEST')

    const outsiderRes = await request(createApp())
      .post(`/api/v1/checkin-sessions/${createRes.body.data.id}/checkin`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .send({ code: createRes.body.data.code })

    expect(outsiderRes.status).toBe(400)
    expect(outsiderRes.body.error.code).toBe('BAD_REQUEST')

    const manualRes = await request(createApp())
      .post(`/api/v1/checkin-sessions/${createRes.body.data.id}/manual-records`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        userId: participant.id,
        status: 'CHECKED_IN',
      })

    expect(manualRes.status).toBe(200)
    expect(manualRes.body.data.userId).toBe(participant.id)
    expect(manualRes.body.data.status).toBe('CHECKED_IN')

    const closeRes = await request(createApp())
      .post(`/api/v1/checkin-sessions/${createRes.body.data.id}/close`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)

    expect(closeRes.status).toBe(200)
    expect(closeRes.body.data.status).toBe('CLOSED')
    expect(closeRes.body.data.signedCount).toBe(1)

    const closedCheckinRes = await request(createApp())
      .post(`/api/v1/checkin-sessions/${createRes.body.data.id}/checkin`)
      .set('Authorization', `Bearer ${participant.accessToken}`)
      .send({ code: createRes.body.data.code })

    expect(closedCheckinRes.status).toBe(400)
    expect(closedCheckinRes.body.error.code).toBe('BAD_REQUEST')
  })
})
