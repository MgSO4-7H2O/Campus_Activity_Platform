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

type CheckinMethod = 'CODE' | 'QRCODE' | 'MANUAL'

type CheckinFixtureInput = {
  organizerUsername: string
  participantUsername: string
  orgCode: string
  activityTitle: string
  recruitmentTitle: string
  method: CheckinMethod
  startAt: string
  endAt: string
}

async function createApprovedCheckinFixture(input: CheckinFixtureInput) {
  const organizer = await registerTestUser({
    username: input.organizerUsername,
    userType: 'student',
    realName: '签到负责人',
  })
  await grantRole(organizer.id, 'ORGANIZER')
  const participant = await registerTestUser({
    username: input.participantUsername,
    userType: 'student',
    realName: '签到参与人',
  })
  const organization = await createTestOrganization({
    orgCode: input.orgCode,
    name: `${input.orgCode}组织`,
    type: 'CLUB',
  })
  const activity = await createTestActivity({
    organizerId: organizer.id,
    organizationId: organization.id,
    title: input.activityTitle,
    status: 'ONGOING',
  })
  const recruitment = await prisma.recruitment.create({
    data: {
      activityId: activity.id,
      title: input.recruitmentTitle,
      quota: 30,
      signupStartTime: new Date('2026-01-01T00:00:00.000Z'),
      signupEndTime: new Date('2027-01-01T00:00:00.000Z'),
      targetUserType: 'STUDENT',
      requiresAttachment: false,
      status: 'PUBLISHED',
    },
  })
  const signup = await prisma.recruitmentSignup.create({
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
      title: input.activityTitle,
      method: input.method,
      startAt: input.startAt,
      endAt: input.endAt,
    })

  if (createRes.status !== 201) {
    throw new Error(`Failed to create checkin session: ${createRes.text}`)
  }

  return {
    organizer,
    participant,
    activity,
    signupId: signup.id,
    sessionId: createRes.body.data.id as string,
    code: createRes.body.data.code as string | null,
  }
}

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

  it('creates qrcode session and requires qrcode token during checkin', async () => {
    const fixture = await createApprovedCheckinFixture({
      organizerUsername: 'qrcode_owner',
      participantUsername: 'qrcode_participant',
      orgCode: 'TEST_QRCODE_ORG',
      activityTitle: '二维码签到活动',
      recruitmentTitle: '二维码签到招募',
      method: 'QRCODE',
      startAt: '2026-01-01T00:00:00.000Z',
      endAt: '2027-01-01T00:00:00.000Z',
    })

    expect(fixture.code).toMatch(/^[a-f0-9]{32}$/)

    await request(createApp())
      .post(`/api/v1/checkin-sessions/${fixture.sessionId}/open`)
      .set('Authorization', `Bearer ${fixture.organizer.accessToken}`)

    const wrongTokenRes = await request(createApp())
      .post(`/api/v1/checkin-sessions/${fixture.sessionId}/checkin`)
      .set('Authorization', `Bearer ${fixture.participant.accessToken}`)
      .send({ code: 'wrong-qrcode-token' })

    expect(wrongTokenRes.status).toBe(400)
    expect(wrongTokenRes.body.error.code).toBe('BAD_REQUEST')

    const checkinRes = await request(createApp())
      .post(`/api/v1/checkin-sessions/${fixture.sessionId}/checkin`)
      .set('Authorization', `Bearer ${fixture.participant.accessToken}`)
      .send({ code: fixture.code })

    expect(checkinRes.status).toBe(200)
    expect(checkinRes.body.data.userId).toBe(fixture.participant.id)
    expect(checkinRes.body.data.method).toBe('QRCODE')
  })

  it('rejects checkin management actions from non-owner users', async () => {
    const fixture = await createApprovedCheckinFixture({
      organizerUsername: 'perm_owner',
      participantUsername: 'perm_participant',
      orgCode: 'TEST_CHECKIN_PERMISSION_ORG',
      activityTitle: '签到权限活动',
      recruitmentTitle: '签到权限招募',
      method: 'CODE',
      startAt: '2026-01-01T00:00:00.000Z',
      endAt: '2027-01-01T00:00:00.000Z',
    })
    const nonOwner = await registerTestUser({
      username: 'perm_non_owner',
      userType: 'student',
      realName: '非负责人',
    })

    const createRes = await request(createApp())
      .post('/api/v1/checkin-sessions')
      .set('Authorization', `Bearer ${nonOwner.accessToken}`)
      .send({
        activityId: fixture.activity.id,
        title: '非法创建签到',
        method: 'CODE',
        startAt: '2026-01-01T00:00:00.000Z',
        endAt: '2027-01-01T00:00:00.000Z',
      })
    const openRes = await request(createApp())
      .post(`/api/v1/checkin-sessions/${fixture.sessionId}/open`)
      .set('Authorization', `Bearer ${nonOwner.accessToken}`)
    const recordsRes = await request(createApp())
      .get(`/api/v1/checkin-sessions/${fixture.sessionId}/records`)
      .set('Authorization', `Bearer ${nonOwner.accessToken}`)
    const manualRes = await request(createApp())
      .post(`/api/v1/checkin-sessions/${fixture.sessionId}/manual-records`)
      .set('Authorization', `Bearer ${nonOwner.accessToken}`)
      .send({ userId: fixture.participant.id })
    const closeRes = await request(createApp())
      .post(`/api/v1/checkin-sessions/${fixture.sessionId}/close`)
      .set('Authorization', `Bearer ${nonOwner.accessToken}`)

    expect(createRes.status).toBe(403)
    expect(openRes.status).toBe(403)
    expect(recordsRes.status).toBe(403)
    expect(manualRes.status).toBe(403)
    expect(closeRes.status).toBe(403)
  })

  it('rejects participant checkin outside session time window', async () => {
    const fixture = await createApprovedCheckinFixture({
      organizerUsername: 'time_owner',
      participantUsername: 'time_participant',
      orgCode: 'TEST_CHECKIN_TIME_ORG',
      activityTitle: '签到时间活动',
      recruitmentTitle: '签到时间招募',
      method: 'CODE',
      startAt: '2099-01-01T00:00:00.000Z',
      endAt: '2099-01-02T00:00:00.000Z',
    })

    await request(createApp())
      .post(`/api/v1/checkin-sessions/${fixture.sessionId}/open`)
      .set('Authorization', `Bearer ${fixture.organizer.accessToken}`)

    const res = await request(createApp())
      .post(`/api/v1/checkin-sessions/${fixture.sessionId}/checkin`)
      .set('Authorization', `Bearer ${fixture.participant.accessToken}`)
      .send({ code: fixture.code })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })

  it('rejects participant checkin after session end time', async () => {
    const fixture = await createApprovedCheckinFixture({
      organizerUsername: 'ended_owner',
      participantUsername: 'ended_participant',
      orgCode: 'TEST_CHECKIN_ENDED_ORG',
      activityTitle: '签到结束活动',
      recruitmentTitle: '签到结束招募',
      method: 'CODE',
      startAt: '2020-01-01T00:00:00.000Z',
      endAt: '2020-01-02T00:00:00.000Z',
    })

    await request(createApp())
      .post(`/api/v1/checkin-sessions/${fixture.sessionId}/open`)
      .set('Authorization', `Bearer ${fixture.organizer.accessToken}`)

    const res = await request(createApp())
      .post(`/api/v1/checkin-sessions/${fixture.sessionId}/checkin`)
      .set('Authorization', `Bearer ${fixture.participant.accessToken}`)
      .send({ code: fixture.code })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })

  it('rejects checkin after an approved signup is cancelled', async () => {
    const fixture = await createApprovedCheckinFixture({
      organizerUsername: 'cancel_owner',
      participantUsername: 'cancel_participant',
      orgCode: 'TEST_CHECKIN_CANCEL_ORG',
      activityTitle: '取消报名签到活动',
      recruitmentTitle: '取消报名签到招募',
      method: 'CODE',
      startAt: '2020-01-01T00:00:00.000Z',
      endAt: '2099-01-01T00:00:00.000Z',
    })
    await prisma.recruitmentSignup.update({
      where: { id: fixture.signupId },
      data: { status: 'CANCELLED' },
    })

    await request(createApp())
      .post(`/api/v1/checkin-sessions/${fixture.sessionId}/open`)
      .set('Authorization', `Bearer ${fixture.organizer.accessToken}`)

    const res = await request(createApp())
      .post(`/api/v1/checkin-sessions/${fixture.sessionId}/checkin`)
      .set('Authorization', `Bearer ${fixture.participant.accessToken}`)
      .send({ code: fixture.code })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')

    const recordCount = await prisma.checkinRecord.count({
      where: {
        sessionId: fixture.sessionId,
        userId: fixture.participant.id,
      },
    })
    expect(recordCount).toBe(0)
  })
})
