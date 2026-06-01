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
})
