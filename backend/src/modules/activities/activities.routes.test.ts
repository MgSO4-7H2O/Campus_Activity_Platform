import request from 'supertest'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../../app.js'
import {
  cleanupTestData,
  createTestActivity,
  createTestOrganization,
  ensureCoreRoles,
  grantRole,
  registerTestUser,
} from '../../test/fixtures.js'

describe('Activity APIs', () => {
  beforeAll(async () => {
    await ensureCoreRoles()
  })

  beforeEach(async () => {
    await cleanupTestData()
    await ensureCoreRoles()
  })

  it('lists activities, filters by keyword, reads detail, and lists my activities', async () => {
    const organizer = await registerTestUser({
      username: 'activity_owner',
      userType: 'student',
      realName: '活动负责人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const organization = await createTestOrganization({
      orgCode: 'TEST_ACTIVITY_ORG',
      name: '活动测试组织',
      type: 'CLUB',
    })
    const activity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '春季志愿服务',
      status: 'PLANNED',
    })

    const listRes = await request(createApp()).get('/api/v1/activities').query({
      keyword: '志愿',
      status: 'PLANNED',
    })

    expect(listRes.status).toBe(200)
    expect(listRes.body.data).toHaveLength(1)
    expect(listRes.body.data[0].id).toBe(activity.id)
    expect(listRes.body.data[0].organizationName).toBe('活动测试组织')

    const detailRes = await request(createApp()).get(`/api/v1/activities/${activity.id}`)

    expect(detailRes.status).toBe(200)
    expect(detailRes.body.data.title).toBe('春季志愿服务')

    const myRes = await request(createApp())
      .get('/api/v1/activities/me')
      .set('Authorization', `Bearer ${organizer.accessToken}`)

    expect(myRes.status).toBe(200)
    expect(myRes.body.data).toHaveLength(1)
    expect(myRes.body.data[0].organizerId).toBe(organizer.id)
  })

  it('starts and finishes an activity by organizer', async () => {
    const organizer = await registerTestUser({
      username: 'activity_life_owner',
      userType: 'student',
      realName: '活动流转负责人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const organization = await createTestOrganization({
      orgCode: 'TEST_ACTIVITY_LIFECYCLE_ORG',
      name: '活动流转组织',
      type: 'CLUB',
    })
    const activity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '活动流转测试',
      status: 'RECRUITING',
    })

    const startRes = await request(createApp())
      .post(`/api/v1/activities/${activity.id}/start`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)

    expect(startRes.status).toBe(200)
    expect(startRes.body.data.status).toBe('ONGOING')

    const finishRes = await request(createApp())
      .post(`/api/v1/activities/${activity.id}/finish`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)

    expect(finishRes.status).toBe(200)
    expect(finishRes.body.data.status).toBe('FINISHED')
  })

  it('rejects lifecycle changes from non-owner and invalid status transitions', async () => {
    const organizer = await registerTestUser({
      username: 'activity_guard_owner',
      userType: 'student',
      realName: '活动保护负责人',
    })
    await grantRole(organizer.id, 'ORGANIZER')
    const otherUser = await registerTestUser({
      username: 'activity_guard_other',
      userType: 'student',
      realName: '活动保护其他用户',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_ACTIVITY_GUARD_ORG',
      name: '活动保护组织',
      type: 'CLUB',
    })
    const activity = await createTestActivity({
      organizerId: organizer.id,
      organizationId: organization.id,
      title: '活动保护测试',
      status: 'PLANNED',
    })

    const forbiddenRes = await request(createApp())
      .post(`/api/v1/activities/${activity.id}/start`)
      .set('Authorization', `Bearer ${otherUser.accessToken}`)

    expect(forbiddenRes.status).toBe(403)
    expect(forbiddenRes.body.error.code).toBe('FORBIDDEN')

    const invalidRes = await request(createApp())
      .post(`/api/v1/activities/${activity.id}/finish`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)

    expect(invalidRes.status).toBe(400)
    expect(invalidRes.body.error.code).toBe('BAD_REQUEST')
  })
})
