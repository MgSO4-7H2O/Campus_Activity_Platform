import request from 'supertest'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../../app.js'
import prisma from '../../shared/prisma/client.js'
import {
  assignUserToOrganization,
  cleanupTestData,
  createTestActivity,
  createTestOrganization,
  ensureCoreRoles,
  grantRole,
  registerTestUser,
} from '../../test/fixtures.js'

type ClosureReviewFixtureInput = {
  organizerUsername: string
  reviewerUsername: string
  orgCode: string
  activityTitle: string
}

async function createSubmittedClosureFixture(input: ClosureReviewFixtureInput) {
  const organizer = await registerTestUser({
    username: input.organizerUsername,
    userType: 'student',
    realName: '结项负责人',
  })
  await grantRole(organizer.id, 'ORGANIZER')
  const reviewer = await registerTestUser({
    username: input.reviewerUsername,
    userType: 'teacher',
    realName: '结项审核人',
  })
  await grantRole(reviewer.id, 'REVIEWER')
  const organization = await createTestOrganization({
    orgCode: input.orgCode,
    name: `${input.orgCode}组织`,
    type: 'CLUB',
  })
  await assignUserToOrganization(reviewer.id, organization.id)
  const activity = await createTestActivity({
    organizerId: organizer.id,
    organizationId: organization.id,
    title: input.activityTitle,
    status: 'FINISHED',
  })

  const createRes = await request(createApp())
    .post('/api/v1/closure-applications')
    .set('Authorization', `Bearer ${organizer.accessToken}`)
    .send({
      activityId: activity.id,
      summary: '活动已完成，资料齐全。',
      participants: 25,
    })

  if (createRes.status !== 201) {
    throw new Error(`Failed to create closure application: ${createRes.text}`)
  }

  const submitRes = await request(createApp())
    .post(`/api/v1/closure-applications/${createRes.body.data.id}/submit`)
    .set('Authorization', `Bearer ${organizer.accessToken}`)

  if (submitRes.status !== 200) {
    throw new Error(`Failed to submit closure application: ${submitRes.text}`)
  }

  return {
    organizer,
    reviewer,
    organization,
    activity,
    closureId: createRes.body.data.id as string,
  }
}

describe('Closure application APIs', () => {
  beforeAll(async () => {
    await ensureCoreRoles()
  })

  beforeEach(async () => {
    await cleanupTestData()
    await ensureCoreRoles()
  })

  it('submits a closure application and closes the activity after approval', async () => {
    const organizer = await registerTestUser({
      username: 'closure_organizer',
      userType: 'student',
      realName: '结项负责人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const reviewer = await registerTestUser({
      username: 'closure_reviewer',
      userType: 'teacher',
      realName: '结项审核人',
    })
    await grantRole(reviewer.id, 'REVIEWER')
    const organization = await createTestOrganization({
      orgCode: 'TEST_CLOSURE_ORG',
      name: '结项测试组织',
      type: 'CLUB',
    })
    await assignUserToOrganization(reviewer.id, organization.id)
    const activity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '结项测试活动',
      status: 'FINISHED',
    })

    const createRes = await request(createApp())
      .post('/api/v1/closure-applications')
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        activityId: activity.id,
        summary: '活动已完成，资料齐全。',
        participants: 25,
      })

    expect(createRes.status).toBe(201)
    expect(createRes.body.data.status).toBe('DRAFT')

    const submitRes = await request(createApp())
      .post(`/api/v1/closure-applications/${createRes.body.data.id}/submit`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)

    expect(submitRes.status).toBe(200)
    expect(submitRes.body.data.status).toBe('APPROVING')

    const pendingTask = await prisma.pendingTask.findFirstOrThrow({
      where: {
        assigneeId: reviewer.id,
        relatedResourceType: 'CLOSURE_APPLICATION',
        relatedResourceId: createRes.body.data.id,
      },
    })
    expect(pendingTask.taskType).toBe('CLOSURE_REVIEW')

    const reviewRes = await request(createApp())
      .post(`/api/v1/closure-applications/${createRes.body.data.id}/review`)
      .set('Authorization', `Bearer ${reviewer.accessToken}`)
      .send({
        decision: 'APPROVE',
        comment: '材料完整，同意结项。',
      })

    expect(reviewRes.status).toBe(200)
    expect(reviewRes.body.data.status).toBe('APPROVED')

    const activityAfterReview = await prisma.activity.findUniqueOrThrow({
      where: { id: activity.id },
    })
    expect(activityAfterReview.status).toBe('CLOSED')

    const recordsRes = await request(createApp())
      .get(`/api/v1/closure-applications/${createRes.body.data.id}/review-records`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)

    expect(recordsRes.status).toBe(200)
    expect(recordsRes.body.data).toHaveLength(1)
    expect(recordsRes.body.data[0].decision).toBe('APPROVE')

    const unreadRes = await request(createApp())
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${organizer.accessToken}`)

    expect(unreadRes.status).toBe(200)
    expect(unreadRes.body.data.count).toBe(1)
  })

  it('rejects closure creation from non-owner, non-finished activity, and duplicate application', async () => {
    const organizer = await registerTestUser({
      username: 'closure_guard_org',
      userType: 'student',
      realName: '结项负责人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const nonOwner = await registerTestUser({
      username: 'closure_guard_out',
      userType: 'student',
      realName: '非负责人',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_CLOSURE_GUARD',
      name: '结项保护组织',
      type: 'CLUB',
    })
    const finishedActivity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '已结束结项活动',
      status: 'FINISHED',
    })
    const ongoingActivity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '进行中结项活动',
      status: 'ONGOING',
    })

    const nonOwnerRes = await request(createApp())
      .post('/api/v1/closure-applications')
      .set('Authorization', `Bearer ${nonOwner.accessToken}`)
      .send({
        activityId: finishedActivity.id,
        summary: '尝试代提交结项。',
        participants: 1,
      })

    expect(nonOwnerRes.status).toBe(400)
    expect(nonOwnerRes.body.error.code).toBe('BAD_REQUEST')

    const ongoingRes = await request(createApp())
      .post('/api/v1/closure-applications')
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        activityId: ongoingActivity.id,
        summary: '活动未结束，不可结项。',
        participants: 1,
      })

    expect(ongoingRes.status).toBe(400)
    expect(ongoingRes.body.error.code).toBe('BAD_REQUEST')

    const createRes = await request(createApp())
      .post('/api/v1/closure-applications')
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        activityId: finishedActivity.id,
        summary: '首次提交结项。',
        participants: 10,
      })

    expect(createRes.status).toBe(201)

    const duplicateRes = await request(createApp())
      .post('/api/v1/closure-applications')
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        activityId: finishedActivity.id,
        summary: '重复提交结项。',
        participants: 10,
      })

    expect(duplicateRes.status).toBe(400)
    expect(duplicateRes.body.error.code).toBe('BAD_REQUEST')
  })

  it('lets applicant upload closure attachment and rejects non-applicant upload', async () => {
    const organizer = await registerTestUser({
      username: 'closure_att_owner',
      userType: 'student',
      realName: '结项附件负责人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const outsider = await registerTestUser({
      username: 'closure_att_out',
      userType: 'student',
      realName: '结项附件无关用户',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_CLOSURE_ATTACHMENT',
      name: '结项附件组织',
      type: 'CLUB',
    })
    const activity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '结项附件活动',
      status: 'FINISHED',
    })
    const createRes = await request(createApp())
      .post('/api/v1/closure-applications')
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        activityId: activity.id,
        summary: '活动已完成，准备上传结项附件。',
        participants: 12,
      })

    const uploadRes = await request(createApp())
      .post(`/api/v1/closure-applications/${createRes.body.data.id}/attachments`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .attach('file', Buffer.from('closure attachment content'), {
        filename: 'closure-report.txt',
        contentType: 'text/plain',
      })
    const detailRes = await request(createApp())
      .get(`/api/v1/closure-applications/${createRes.body.data.id}`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
    const outsiderUploadRes = await request(createApp())
      .post(`/api/v1/closure-applications/${createRes.body.data.id}/attachments`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .attach('file', Buffer.from('forbidden'), {
        filename: 'forbidden.txt',
        contentType: 'text/plain',
      })

    expect(createRes.status).toBe(201)
    expect(uploadRes.status).toBe(201)
    expect(uploadRes.body.data.fileName).toBe('closure-report.txt')
    expect(detailRes.status).toBe(200)
    expect(detailRes.body.data.attachments[0].id).toBe(uploadRes.body.data.id)
    expect(outsiderUploadRes.status).toBe(400)
    expect(outsiderUploadRes.body.error.code).toBe('BAD_REQUEST')
  })

  it('rejects closure review from non-reviewer user', async () => {
    const fixture = await createSubmittedClosureFixture({
      organizerUsername: 'closure_no_rev_o',
      reviewerUsername: 'closure_no_rev_r',
      orgCode: 'TEST_CLOSURE_NO_REVIEWER',
      activityTitle: '非审核人结项活动',
    })
    const nonReviewer = await registerTestUser({
      username: 'closure_not_reviewer',
      userType: 'student',
      realName: '非审核人',
    })

    const res = await request(createApp())
      .post(`/api/v1/closure-applications/${fixture.closureId}/review`)
      .set('Authorization', `Bearer ${nonReviewer.accessToken}`)
      .send({
        decision: 'APPROVE',
        comment: '无权审核。',
      })

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('rejects closure application without closing the activity', async () => {
    const fixture = await createSubmittedClosureFixture({
      organizerUsername: 'closure_reject_o',
      reviewerUsername: 'closure_reject_r',
      orgCode: 'TEST_CLOSURE_REJECT',
      activityTitle: '拒绝结项活动',
    })

    const res = await request(createApp())
      .post(`/api/v1/closure-applications/${fixture.closureId}/review`)
      .set('Authorization', `Bearer ${fixture.reviewer.accessToken}`)
      .send({
        decision: 'REJECT',
        comment: '材料不完整。',
      })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('REJECTED')

    const activity = await prisma.activity.findUniqueOrThrow({
      where: { id: fixture.activity.id },
    })
    expect(activity.status).toBe('FINISHED')

    const repeatedReviewRes = await request(createApp())
      .post(`/api/v1/closure-applications/${fixture.closureId}/review`)
      .set('Authorization', `Bearer ${fixture.reviewer.accessToken}`)
      .send({
        decision: 'APPROVE',
        comment: '重复审核。',
      })

    expect(repeatedReviewRes.status).toBe(400)
    expect(repeatedReviewRes.body.error.code).toBe('BAD_REQUEST')
  })

  it('returns closure for more materials and lets applicant update then resubmit', async () => {
    const fixture = await createSubmittedClosureFixture({
      organizerUsername: 'closure_more_o',
      reviewerUsername: 'closure_more_r',
      orgCode: 'TEST_CLOSURE_MORE',
      activityTitle: '补材料结项活动',
    })

    const needMoreRes = await request(createApp())
      .post(`/api/v1/closure-applications/${fixture.closureId}/review`)
      .set('Authorization', `Bearer ${fixture.reviewer.accessToken}`)
      .send({
        decision: 'NEED_MORE',
        comment: '请补充照片。',
      })

    expect(needMoreRes.status).toBe(200)
    expect(needMoreRes.body.data.status).toBe('NEED_MORE')

    const updateRes = await request(createApp())
      .patch(`/api/v1/closure-applications/${fixture.closureId}`)
      .set('Authorization', `Bearer ${fixture.organizer.accessToken}`)
      .send({
        summary: '已补充照片和签到记录。',
        participants: 26,
      })

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.data.summary).toBe('已补充照片和签到记录。')
    expect(updateRes.body.data.participants).toBe(26)

    const submitRes = await request(createApp())
      .post(`/api/v1/closure-applications/${fixture.closureId}/submit`)
      .set('Authorization', `Bearer ${fixture.organizer.accessToken}`)

    expect(submitRes.status).toBe(200)
    expect(submitRes.body.data.status).toBe('APPROVING')

    const pendingTaskCount = await prisma.pendingTask.count({
      where: {
        relatedResourceType: 'CLOSURE_APPLICATION',
        relatedResourceId: fixture.closureId,
        status: 'PENDING',
      },
    })
    expect(pendingTaskCount).toBe(1)
  })
})
