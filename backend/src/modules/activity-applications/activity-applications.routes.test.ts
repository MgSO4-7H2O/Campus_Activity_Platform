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
  type RegisteredTestUser,
} from '../../test/fixtures.js'

type SubmittedApplicationFixture = {
  applicant: RegisteredTestUser
  reviewer: RegisteredTestUser
  applicationId: string
}
type DraftApplicationFixture = {
  applicant: RegisteredTestUser
  applicationId: string
}

async function createDraftApplicationFixture(input: {
  applicantUsername: string
  organizationCode: string
  title: string
}): Promise<DraftApplicationFixture> {
  const applicant = await registerTestUser({
    username: input.applicantUsername,
    userType: 'student',
    realName: '立项申请人',
  })
  const organization = await createTestOrganization({
    orgCode: input.organizationCode,
    name: `${input.title}组织`,
    type: 'CLUB',
  })
  const createRes = await request(createApp())
    .post('/api/v1/activity-applications')
    .set('Authorization', `Bearer ${applicant.accessToken}`)
    .send({
      organizationId: organization.id,
      title: input.title,
      brief: `${input.title}摘要`,
      expectedStart: '2026-06-01T01:00:00.000Z',
      expectedEnd: '2026-06-01T03:00:00.000Z',
      expectedScale: 30,
      budget: 100,
    })

  if (createRes.status !== 201) {
    throw new Error(`Failed to create draft application ${input.title}: ${createRes.text}`)
  }

  return {
    applicant,
    applicationId: createRes.body.data.id as string,
  }
}

async function createSubmittedApplicationFixture(input: {
  applicantUsername: string
  reviewerUsername: string
  organizationCode: string
  title: string
}): Promise<SubmittedApplicationFixture> {
  const applicant = await registerTestUser({
    username: input.applicantUsername,
    userType: 'student',
    realName: '立项申请人',
  })
  const reviewer = await registerTestUser({
    username: input.reviewerUsername,
    userType: 'teacher',
    realName: '立项审核人',
  })
  await grantRole(reviewer.id, 'REVIEWER')
  const organization = await createTestOrganization({
    orgCode: input.organizationCode,
    name: `${input.title}组织`,
    type: 'CLUB',
  })
  await prisma.userOrganization.create({
    data: {
      userId: reviewer.id,
      organizationId: organization.id,
    },
  })
  const createRes = await request(createApp())
    .post('/api/v1/activity-applications')
    .set('Authorization', `Bearer ${applicant.accessToken}`)
    .send({
      organizationId: organization.id,
      title: input.title,
      brief: `${input.title}摘要`,
      expectedStart: '2026-06-01T01:00:00.000Z',
      expectedEnd: '2026-06-01T03:00:00.000Z',
      expectedScale: 30,
      budget: 100,
    })

  const submitRes = await request(createApp())
    .post(`/api/v1/activity-applications/${createRes.body.data.id}/submit`)
    .set('Authorization', `Bearer ${applicant.accessToken}`)

  if (submitRes.status !== 200) {
    throw new Error(`Failed to submit test application ${input.title}: ${submitRes.text}`)
  }

  return {
    applicant,
    reviewer,
    applicationId: createRes.body.data.id as string,
  }
}

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
        brief: '测试立项摘要',
        location: '测试教室',
        expectedStart: '2026-06-01T01:00:00.000Z',
        expectedEnd: '2026-06-01T03:00:00.000Z',
        expectedScale: 30,
        budget: 100,
      })

    expect(res.status).toBe(201)
    expect(res.body.data.title).toBe('测试立项活动')
    expect(res.body.data.status).toBe('DRAFT')
    expect(res.body.data.organizerId).toBe(user.id)
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
        brief: '原始摘要',
        expectedStart: '2026-06-01T01:00:00.000Z',
        expectedEnd: '2026-06-01T03:00:00.000Z',
        expectedScale: 30,
        budget: 100,
      })

    const updateRes = await request(createApp())
      .patch(`/api/v1/activity-applications/${createRes.body.data.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: '更新后的标题',
        brief: '更新后的摘要',
      })

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.data.title).toBe('更新后的标题')
    expect(updateRes.body.data.brief).toBe('更新后的摘要')
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
        brief: '本人立项摘要',
        expectedStart: '2026-06-01T01:00:00.000Z',
        expectedEnd: '2026-06-01T03:00:00.000Z',
        expectedScale: 30,
        budget: 100,
      })

    const updateRes = await request(createApp())
      .patch(`/api/v1/activity-applications/${createRes.body.data.id}`)
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
    await prisma.userOrganization.create({
      data: {
        userId: reviewer.id,
        organizationId: organization.id,
      },
    })
    const createRes = await request(createApp())
      .post('/api/v1/activity-applications')
      .set('Authorization', `Bearer ${applicant.accessToken}`)
      .send({
        organizationId: organization.id,
        title: '待提交活动',
        brief: '待提交活动摘要',
        expectedStart: '2026-06-01T01:00:00.000Z',
        expectedEnd: '2026-06-01T03:00:00.000Z',
        expectedScale: 30,
        budget: 100,
      })

    const submitRes = await request(createApp())
      .post(`/api/v1/activity-applications/${createRes.body.data.id}/submit`)
      .set('Authorization', `Bearer ${applicant.accessToken}`)

    expect(submitRes.status).toBe(200)
    expect(submitRes.body.data.status).toBe('APPROVING')
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

  it('lets applicant upload, list, and delete application attachment', async () => {
    const fixture = await createDraftApplicationFixture({
      applicantUsername: 'app_att_owner',
      organizationCode: 'TEST_APP_ATTACHMENT',
      title: '附件立项活动',
    })

    const uploadRes = await request(createApp())
      .post(`/api/v1/activity-applications/${fixture.applicationId}/attachments`)
      .set('Authorization', `Bearer ${fixture.applicant.accessToken}`)
      .attach('file', Buffer.from('activity attachment content'), {
        filename: 'plan.txt',
        contentType: 'text/plain',
      })

    expect(uploadRes.status).toBe(201)
    expect(uploadRes.body.data.fileName).toBe('plan.txt')
    expect(uploadRes.body.data.fileSize).toBe(Buffer.byteLength('activity attachment content'))
    expect(uploadRes.body.data.fileUrl).toContain('/uploads/')

    const detailRes = await request(createApp())
      .get(`/api/v1/activity-applications/${fixture.applicationId}`)
      .set('Authorization', `Bearer ${fixture.applicant.accessToken}`)

    expect(detailRes.status).toBe(200)
    expect(detailRes.body.data.attachments).toHaveLength(1)
    expect(detailRes.body.data.attachments[0].id).toBe(uploadRes.body.data.id)

    const deleteRes = await request(createApp())
      .delete(`/api/v1/activity-applications/${fixture.applicationId}/attachments/${uploadRes.body.data.id}`)
      .set('Authorization', `Bearer ${fixture.applicant.accessToken}`)

    expect(deleteRes.status).toBe(204)

    const afterDeleteRes = await request(createApp())
      .get(`/api/v1/activity-applications/${fixture.applicationId}`)
      .set('Authorization', `Bearer ${fixture.applicant.accessToken}`)

    expect(afterDeleteRes.status).toBe(200)
    expect(afterDeleteRes.body.data.attachments).toHaveLength(0)
  })

  it('rejects attachment upload from non-applicant user', async () => {
    const fixture = await createDraftApplicationFixture({
      applicantUsername: 'att_owner',
      organizationCode: 'TEST_APP_ATTACHMENT_FORBID',
      title: '附件越权活动',
    })
    const other = await registerTestUser({
      username: 'att_other',
      userType: 'student',
      realName: '附件越权用户',
    })

    const uploadRes = await request(createApp())
      .post(`/api/v1/activity-applications/${fixture.applicationId}/attachments`)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .attach('file', Buffer.from('forbidden'), {
        filename: 'forbidden.txt',
        contentType: 'text/plain',
      })

    expect(uploadRes.status).toBe(400)
    expect(uploadRes.body.error.code).toBe('BAD_REQUEST')
  })

  it('rejects deleting an attachment through a different application id', async () => {
    const ownerFixture = await createDraftApplicationFixture({
      applicantUsername: 'att_del_owner',
      organizationCode: 'TEST_APP_ATTACHMENT_DELETE',
      title: '附件删除活动',
    })
    const otherFixture = await createDraftApplicationFixture({
      applicantUsername: 'att_del_other',
      organizationCode: 'TEST_APP_ATTACHMENT_OTHER',
      title: '其他附件活动',
    })
    const uploadRes = await request(createApp())
      .post(`/api/v1/activity-applications/${ownerFixture.applicationId}/attachments`)
      .set('Authorization', `Bearer ${ownerFixture.applicant.accessToken}`)
      .attach('file', Buffer.from('private attachment'), {
        filename: 'private.txt',
        contentType: 'text/plain',
      })

    const deleteRes = await request(createApp())
      .delete(`/api/v1/activity-applications/${otherFixture.applicationId}/attachments/${uploadRes.body.data.id}`)
      .set('Authorization', `Bearer ${otherFixture.applicant.accessToken}`)

    expect(deleteRes.status).toBe(404)

    const attachment = await prisma.applicationAttachment.findUnique({
      where: { id: uploadRes.body.data.id },
    })
    expect(attachment?.applicationId).toBe(ownerFixture.applicationId)
  })

  it('rejects submitted application and records the review decision', async () => {
    const fixture = await createSubmittedApplicationFixture({
      applicantUsername: 'app_rej_owner',
      reviewerUsername: 'app_rej_rev',
      organizationCode: 'TEST_APP_REJECT',
      title: '驳回立项活动',
    })

    const reviewRes = await request(createApp())
      .post(`/api/v1/approval/activity-applications/${fixture.applicationId}/review`)
      .set('Authorization', `Bearer ${fixture.reviewer.accessToken}`)
      .send({
        decision: 'REJECT',
        comment: '活动方案风险预案不足',
      })

    expect(reviewRes.status).toBe(200)
    expect(reviewRes.body.data.status).toBe('REJECTED')

    const record = await prisma.approvalRecord.findFirstOrThrow({
      where: { activityApplicationId: fixture.applicationId },
    })
    expect(record.result).toBe('REJECTED')
    expect(record.comment).toBe('活动方案风险预案不足')

    const pendingTask = await prisma.pendingTask.findFirstOrThrow({
      where: {
        relatedResourceType: 'ACTIVITY_APPLICATION',
        relatedResourceId: fixture.applicationId,
      },
    })
    expect(pendingTask.status).toBe('PROCESSED')
  })

  it('lets assigned reviewer read approval detail and rejects unrelated users', async () => {
    const fixture = await createSubmittedApplicationFixture({
      applicantUsername: 'app_detail_owner',
      reviewerUsername: 'app_detail_rev',
      organizationCode: 'TEST_APP_DETAIL',
      title: '审核详情权限活动',
    })
    const outsider = await registerTestUser({
      username: 'app_detail_out',
      userType: 'student',
      realName: '无关查看用户',
    })

    const reviewerRes = await request(createApp())
      .get(`/api/v1/approval/activity-applications/${fixture.applicationId}`)
      .set('Authorization', `Bearer ${fixture.reviewer.accessToken}`)
    const outsiderRes = await request(createApp())
      .get(`/api/v1/approval/activity-applications/${fixture.applicationId}`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)

    expect(reviewerRes.status).toBe(200)
    expect(reviewerRes.body.data.id).toBe(fixture.applicationId)
    expect(outsiderRes.status).toBe(403)
    expect(outsiderRes.body.error.code).toBe('FORBIDDEN')
  })

  it('rejects review from reviewer who is not assigned to the current application', async () => {
    const fixture = await createSubmittedApplicationFixture({
      applicantUsername: 'app_wrong_rev_owner',
      reviewerUsername: 'app_wrong_assigned',
      organizationCode: 'TEST_APP_WRONG_REVIEWER',
      title: '错误审核人活动',
    })
    const otherReviewer = await registerTestUser({
      username: 'app_wrong_other',
      userType: 'teacher',
      realName: '未分配审核人',
    })
    await grantRole(otherReviewer.id, 'REVIEWER')

    const reviewRes = await request(createApp())
      .post(`/api/v1/approval/activity-applications/${fixture.applicationId}/review`)
      .set('Authorization', `Bearer ${otherReviewer.accessToken}`)
      .send({
        decision: 'APPROVE',
        comment: '越权审核通过',
      })

    expect(reviewRes.status).toBe(403)
    expect(reviewRes.body.error.code).toBe('FORBIDDEN')
  })

  it('returns application for more materials and allows applicant to resubmit', async () => {
    const fixture = await createSubmittedApplicationFixture({
      applicantUsername: 'app_need_owner',
      reviewerUsername: 'app_need_rev',
      organizationCode: 'TEST_APP_NEED_MORE',
      title: '补材料立项活动',
    })

    const reviewRes = await request(createApp())
      .post(`/api/v1/approval/activity-applications/${fixture.applicationId}/review`)
      .set('Authorization', `Bearer ${fixture.reviewer.accessToken}`)
      .send({
        decision: 'NEED_MORE',
        comment: '请补充预算说明',
      })

    expect(reviewRes.status).toBe(200)
    expect(reviewRes.body.data.status).toBe('NEED_MORE')

    const updateRes = await request(createApp())
      .patch(`/api/v1/activity-applications/${fixture.applicationId}`)
      .set('Authorization', `Bearer ${fixture.applicant.accessToken}`)
      .send({
        brief: '已补充预算说明后的活动摘要',
      })
    expect(updateRes.status).toBe(200)
    expect(updateRes.body.data.brief).toBe('已补充预算说明后的活动摘要')

    const resubmitRes = await request(createApp())
      .post(`/api/v1/activity-applications/${fixture.applicationId}/submit`)
      .set('Authorization', `Bearer ${fixture.applicant.accessToken}`)

    expect(resubmitRes.status).toBe(200)
    expect(resubmitRes.body.data.status).toBe('APPROVING')

    const pendingTasks = await prisma.pendingTask.findMany({
      where: {
        relatedResourceType: 'ACTIVITY_APPLICATION',
        relatedResourceId: fixture.applicationId,
      },
      orderBy: { createdAt: 'asc' },
    })
    expect(pendingTasks.map((task) => task.status)).toEqual(['PROCESSED', 'PENDING'])
  })

  it('approves final review and creates planned activity from application', async () => {
    const fixture = await createSubmittedApplicationFixture({
      applicantUsername: 'app_ok_owner',
      reviewerUsername: 'app_ok_rev',
      organizationCode: 'TEST_APP_APPROVE',
      title: '通过立项活动',
    })

    const reviewRes = await request(createApp())
      .post(`/api/v1/approval/activity-applications/${fixture.applicationId}/review`)
      .set('Authorization', `Bearer ${fixture.reviewer.accessToken}`)
      .send({
        decision: 'APPROVE',
        comment: '方案完整，同意立项',
      })

    expect(reviewRes.status).toBe(200)
    expect(reviewRes.body.data.status).toBe('APPROVED')

    const activity = await prisma.activity.findUniqueOrThrow({
      where: { applicationId: fixture.applicationId },
    })
    expect(activity.title).toBe('通过立项活动')
    expect(activity.organizerId).toBe(fixture.applicant.id)
    expect(activity.status).toBe('PLANNED')
  })

  it('lists approval records for an application', async () => {
    const fixture = await createSubmittedApplicationFixture({
      applicantUsername: 'app_rec_owner',
      reviewerUsername: 'app_rec_rev',
      organizationCode: 'TEST_APP_RECORDS',
      title: '审核记录活动',
    })
    await request(createApp())
      .post(`/api/v1/approval/activity-applications/${fixture.applicationId}/review`)
      .set('Authorization', `Bearer ${fixture.reviewer.accessToken}`)
      .send({
        decision: 'APPROVE',
        comment: '审核记录测试通过',
      })

    const recordsRes = await request(createApp())
      .get(`/api/v1/activity-applications/${fixture.applicationId}/approval-records`)
      .set('Authorization', `Bearer ${fixture.applicant.accessToken}`)

    expect(recordsRes.status).toBe(200)
    expect(recordsRes.body.data).toHaveLength(1)
    expect(recordsRes.body.data[0]).toMatchObject({
      applicationId: fixture.applicationId,
      level: 1,
      reviewerId: fixture.reviewer.id,
      reviewerName: '立项审核人',
      decision: 'APPROVE',
      comment: '审核记录测试通过',
    })
  })
})
