import request from 'supertest'
import type { Recruitment, RecruitmentTargetUserType } from '@prisma/client'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../../app.js'
import prisma from '../../shared/prisma/client.js'
import {
  cleanupTestData,
  createTestActivity,
  createTestOrganization,
  ensureCoreRoles,
  grantRole,
  type RegisteredTestUser,
  registerTestUser,
} from '../../test/fixtures.js'

type CreatePublishedRecruitmentInput = {
  organizerUsername: string
  orgCode: string
  activityTitle: string
  recruitmentTitle: string
  quota: number
  signupStartTime: Date
  signupEndTime: Date
  targetUserType: RecruitmentTargetUserType
  minGrade: number | null
  maxGrade: number | null
  allowedMajors: string[]
}

type PublishedRecruitmentFixture = {
  organizer: RegisteredTestUser
  recruitment: Recruitment
}

async function createPublishedRecruitmentFixture(
  input: CreatePublishedRecruitmentInput
): Promise<PublishedRecruitmentFixture> {
  const organizer = await registerTestUser({
    username: input.organizerUsername,
    userType: 'student',
    realName: '招募边界负责人',
  })
  await grantRole(organizer.id, 'ORGANIZER')
  const organization = await createTestOrganization({
    orgCode: input.orgCode,
    name: `${input.orgCode}组织`,
    type: 'CLUB',
  })
  const activity = await createTestActivity({
    organizerId: organizer.id,
    organizationId: organization.id,
    title: input.activityTitle,
    status: 'RECRUITING',
  })
  const recruitment = await prisma.recruitment.create({
    data: {
      activityId: activity.id,
      title: input.recruitmentTitle,
      quota: input.quota,
      signupStartTime: input.signupStartTime,
      signupEndTime: input.signupEndTime,
      targetUserType: input.targetUserType,
      minGrade: input.minGrade,
      maxGrade: input.maxGrade,
      requiresAttachment: false,
      status: 'PUBLISHED',
    },
  })

  if (input.allowedMajors.length > 0) {
    await prisma.recruitmentAllowedMajor.createMany({
      data: input.allowedMajors.map((major) => ({
        recruitmentId: recruitment.id,
        majorName: major,
      })),
    })
  }

  return { organizer, recruitment }
}

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

  it('rejects publishing a closed recruitment', async () => {
    const organizer = await registerTestUser({
      username: 'recruit_closed_org',
      userType: 'student',
      realName: '关闭招募负责人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const organization = await createTestOrganization({
      orgCode: 'TEST_RECRUIT_CLOSED_ORG',
      name: '关闭招募组织',
      type: 'CLUB',
    })
    const activity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '关闭招募活动',
      status: 'RECRUITING',
    })
    const recruitment = await prisma.recruitment.create({
      data: {
        activityId: activity.id,
        title: '已关闭招募',
        quota: 5,
        signupStartTime: new Date('2026-01-01T00:00:00.000Z'),
        signupEndTime: new Date('2027-01-01T00:00:00.000Z'),
        targetUserType: 'STUDENT',
        requiresAttachment: false,
        status: 'CLOSED',
      },
    })

    const res = await request(createApp())
      .post(`/api/v1/recruitments/${recruitment.id}/publish`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')

    const persisted = await prisma.recruitment.findUniqueOrThrow({
      where: { id: recruitment.id },
    })
    expect(persisted.status).toBe('CLOSED')
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

  it('allows applicant attachment upload and protects signup detail permissions', async () => {
    const fixture = await createPublishedRecruitmentFixture({
      organizerUsername: 'sign_att_owner',
      orgCode: 'SIGN_ATT_ORG',
      activityTitle: '报名附件活动',
      recruitmentTitle: '报名附件招募',
      quota: 10,
      signupStartTime: new Date('2026-01-01T00:00:00.000Z'),
      signupEndTime: new Date('2027-01-01T00:00:00.000Z'),
      targetUserType: 'STUDENT',
      minGrade: null,
      maxGrade: null,
      allowedMajors: [],
    })
    const applicant = await registerTestUser({
      username: 'sign_att_app',
      userType: 'student',
      realName: '报名附件申请人',
    })
    const outsider = await registerTestUser({
      username: 'sign_att_out',
      userType: 'student',
      realName: '报名附件无关用户',
    })

    const signupRes = await request(createApp())
      .post(`/api/v1/recruitments/${fixture.recruitment.id}/signups`)
      .set('Authorization', `Bearer ${applicant.accessToken}`)
      .send({})
    const uploadRes = await request(createApp())
      .post(`/api/v1/signups/${signupRes.body.data.id}/attachments`)
      .set('Authorization', `Bearer ${applicant.accessToken}`)
      .attach('file', Buffer.from('signup attachment content'), {
        filename: 'signup-plan.txt',
        contentType: 'text/plain',
      })
    const applicantDetailRes = await request(createApp())
      .get(`/api/v1/signups/${signupRes.body.data.id}`)
      .set('Authorization', `Bearer ${applicant.accessToken}`)
    const organizerListRes = await request(createApp())
      .get(`/api/v1/recruitments/${fixture.recruitment.id}/signups`)
      .set('Authorization', `Bearer ${fixture.organizer.accessToken}`)
    const outsiderDetailRes = await request(createApp())
      .get(`/api/v1/signups/${signupRes.body.data.id}`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
    const outsiderUploadRes = await request(createApp())
      .post(`/api/v1/signups/${signupRes.body.data.id}/attachments`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .attach('file', Buffer.from('forbidden'), {
        filename: 'forbidden.txt',
        contentType: 'text/plain',
      })

    expect(signupRes.status).toBe(201)
    expect(uploadRes.status).toBe(201)
    expect(uploadRes.body.data.fileName).toBe('signup-plan.txt')
    expect(applicantDetailRes.status).toBe(200)
    expect(applicantDetailRes.body.data.attachments).toHaveLength(1)
    expect(applicantDetailRes.body.data.attachments[0].id).toBe(uploadRes.body.data.id)
    expect(organizerListRes.status).toBe(200)
    expect(organizerListRes.body.data[0].attachments[0].id).toBe(uploadRes.body.data.id)
    expect(outsiderDetailRes.status).toBe(403)
    expect(outsiderDetailRes.body.error.code).toBe('FORBIDDEN')
    expect(outsiderUploadRes.status).toBe(400)
    expect(outsiderUploadRes.body.error.code).toBe('BAD_REQUEST')
  })

  it('releases recruitment capacity after applicant cancels signup', async () => {
    const fixture = await createPublishedRecruitmentFixture({
      organizerUsername: 'release_owner',
      orgCode: 'RELEASE_ORG',
      activityTitle: '取消释放容量活动',
      recruitmentTitle: '取消释放容量招募',
      quota: 1,
      signupStartTime: new Date('2026-01-01T00:00:00.000Z'),
      signupEndTime: new Date('2027-01-01T00:00:00.000Z'),
      targetUserType: 'STUDENT',
      minGrade: null,
      maxGrade: null,
      allowedMajors: [],
    })
    const firstApplicant = await registerTestUser({
      username: 'release_first',
      userType: 'student',
      realName: '释放容量申请人一',
    })
    const secondApplicant = await registerTestUser({
      username: 'release_second',
      userType: 'student',
      realName: '释放容量申请人二',
    })

    const firstSignupRes = await request(createApp())
      .post(`/api/v1/recruitments/${fixture.recruitment.id}/signups`)
      .set('Authorization', `Bearer ${firstApplicant.accessToken}`)
      .send({})
    await request(createApp())
      .post(`/api/v1/signups/${firstSignupRes.body.data.id}/cancel`)
      .set('Authorization', `Bearer ${firstApplicant.accessToken}`)
    const secondSignupRes = await request(createApp())
      .post(`/api/v1/recruitments/${fixture.recruitment.id}/signups`)
      .set('Authorization', `Bearer ${secondApplicant.accessToken}`)
      .send({})

    expect(firstSignupRes.status).toBe(201)
    expect(secondSignupRes.status).toBe(201)
    expect(secondSignupRes.body.data.userId).toBe(secondApplicant.id)
  })

  it('rejects signup when active signup count reaches capacity', async () => {
    const fixture = await createPublishedRecruitmentFixture({
      organizerUsername: 'cap_owner',
      orgCode: 'CAP_ORG',
      activityTitle: '容量边界活动',
      recruitmentTitle: '容量边界招募',
      quota: 1,
      signupStartTime: new Date('2026-01-01T00:00:00.000Z'),
      signupEndTime: new Date('2027-01-01T00:00:00.000Z'),
      targetUserType: 'STUDENT',
      minGrade: null,
      maxGrade: null,
      allowedMajors: [],
    })
    const firstApplicant = await registerTestUser({
      username: 'cap_app_one',
      userType: 'student',
      realName: '容量申请人一',
    })
    const secondApplicant = await registerTestUser({
      username: 'cap_app_two',
      userType: 'student',
      realName: '容量申请人二',
    })

    const firstRes = await request(createApp())
      .post(`/api/v1/recruitments/${fixture.recruitment.id}/signups`)
      .set('Authorization', `Bearer ${firstApplicant.accessToken}`)
      .send({})

    expect(firstRes.status).toBe(201)

    const secondRes = await request(createApp())
      .post(`/api/v1/recruitments/${fixture.recruitment.id}/signups`)
      .set('Authorization', `Bearer ${secondApplicant.accessToken}`)
      .send({})

    expect(secondRes.status).toBe(400)
    expect(secondRes.body.error.code).toBe('BAD_REQUEST')
  })

  it('rejects signup before start time and after end time', async () => {
    const futureFixture = await createPublishedRecruitmentFixture({
      organizerUsername: 'window_future',
      orgCode: 'WIN_FUTURE',
      activityTitle: '未开始活动',
      recruitmentTitle: '未开始招募',
      quota: 10,
      signupStartTime: new Date('2099-01-01T00:00:00.000Z'),
      signupEndTime: new Date('2099-02-01T00:00:00.000Z'),
      targetUserType: 'STUDENT',
      minGrade: null,
      maxGrade: null,
      allowedMajors: [],
    })
    const endedFixture = await createPublishedRecruitmentFixture({
      organizerUsername: 'window_ended',
      orgCode: 'WIN_ENDED',
      activityTitle: '已结束活动',
      recruitmentTitle: '已结束招募',
      quota: 10,
      signupStartTime: new Date('2020-01-01T00:00:00.000Z'),
      signupEndTime: new Date('2020-02-01T00:00:00.000Z'),
      targetUserType: 'STUDENT',
      minGrade: null,
      maxGrade: null,
      allowedMajors: [],
    })
    const applicant = await registerTestUser({
      username: 'window_app',
      userType: 'student',
      realName: '窗口申请人',
    })

    const beforeStartRes = await request(createApp())
      .post(`/api/v1/recruitments/${futureFixture.recruitment.id}/signups`)
      .set('Authorization', `Bearer ${applicant.accessToken}`)
      .send({})
    const afterEndRes = await request(createApp())
      .post(`/api/v1/recruitments/${endedFixture.recruitment.id}/signups`)
      .set('Authorization', `Bearer ${applicant.accessToken}`)
      .send({})

    expect(beforeStartRes.status).toBe(400)
    expect(beforeStartRes.body.error.code).toBe('BAD_REQUEST')
    expect(afterEndRes.status).toBe(400)
    expect(afterEndRes.body.error.code).toBe('BAD_REQUEST')
  })

  it('rejects signup when user type does not match recruitment rule', async () => {
    const fixture = await createPublishedRecruitmentFixture({
      organizerUsername: 'type_owner',
      orgCode: 'TYPE_ORG',
      activityTitle: '类型限制活动',
      recruitmentTitle: '类型限制招募',
      quota: 10,
      signupStartTime: new Date('2026-01-01T00:00:00.000Z'),
      signupEndTime: new Date('2027-01-01T00:00:00.000Z'),
      targetUserType: 'TEACHER',
      minGrade: null,
      maxGrade: null,
      allowedMajors: [],
    })
    const applicant = await registerTestUser({
      username: 'type_student',
      userType: 'student',
      realName: '类型申请人',
    })

    const res = await request(createApp())
      .post(`/api/v1/recruitments/${fixture.recruitment.id}/signups`)
      .set('Authorization', `Bearer ${applicant.accessToken}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })

  it('rejects signup when student grade or major does not match recruitment rule', async () => {
    const gradeFixture = await createPublishedRecruitmentFixture({
      organizerUsername: 'grade_owner',
      orgCode: 'GRADE_ORG',
      activityTitle: '年级限制活动',
      recruitmentTitle: '年级限制招募',
      quota: 10,
      signupStartTime: new Date('2026-01-01T00:00:00.000Z'),
      signupEndTime: new Date('2027-01-01T00:00:00.000Z'),
      targetUserType: 'STUDENT',
      minGrade: 2024,
      maxGrade: 2025,
      allowedMajors: [],
    })
    const majorFixture = await createPublishedRecruitmentFixture({
      organizerUsername: 'major_owner',
      orgCode: 'MAJOR_ORG',
      activityTitle: '专业限制活动',
      recruitmentTitle: '专业限制招募',
      quota: 10,
      signupStartTime: new Date('2026-01-01T00:00:00.000Z'),
      signupEndTime: new Date('2027-01-01T00:00:00.000Z'),
      targetUserType: 'STUDENT',
      minGrade: null,
      maxGrade: null,
      allowedMajors: ['软件工程'],
    })
    const gradeApplicant = await registerTestUser({
      username: 'grade_app',
      userType: 'student',
      realName: '年级申请人',
    })
    const majorApplicant = await registerTestUser({
      username: 'major_app',
      userType: 'student',
      realName: '专业申请人',
    })
    await prisma.studentProfile.update({
      where: { userId: gradeApplicant.id },
      data: { grade: 2023, major: '软件工程' },
    })
    await prisma.studentProfile.update({
      where: { userId: majorApplicant.id },
      data: { grade: 2024, major: '数学' },
    })

    const gradeRes = await request(createApp())
      .post(`/api/v1/recruitments/${gradeFixture.recruitment.id}/signups`)
      .set('Authorization', `Bearer ${gradeApplicant.accessToken}`)
      .send({})
    const majorRes = await request(createApp())
      .post(`/api/v1/recruitments/${majorFixture.recruitment.id}/signups`)
      .set('Authorization', `Bearer ${majorApplicant.accessToken}`)
      .send({})

    expect(gradeRes.status).toBe(400)
    expect(gradeRes.body.error.code).toBe('BAD_REQUEST')
    expect(majorRes.status).toBe(400)
    expect(majorRes.body.error.code).toBe('BAD_REQUEST')
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
