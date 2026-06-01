import request from 'supertest'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../../app.js'
import prisma from '../../shared/prisma/client.js'
import {
  cleanupTestData,
  createTestOrganization,
  ensureCoreRoles,
  registerTestUser,
} from '../../test/fixtures.js'

describe('Approval pending task APIs', () => {
  beforeAll(async () => {
    await ensureCoreRoles()
  })

  beforeEach(async () => {
    await cleanupTestData()
    await ensureCoreRoles()
  })

  it('rejects pending task query without authentication', async () => {
    const res = await request(createApp()).get('/api/v1/pending-tasks/me')

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns only pending tasks assigned to the current user', async () => {
    const assignee = await registerTestUser({
      username: 'task_assignee',
      userType: 'teacher',
      realName: '待办处理人',
    })
    const otherAssignee = await registerTestUser({
      username: 'other_task_assignee',
      userType: 'teacher',
      realName: '其他处理人',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_TASK_RESOURCE',
      name: '待办资源组织',
      type: 'CLUB',
    })
    await prisma.pendingTask.createMany({
      data: [
        {
          assigneeId: assignee.id,
          taskType: 'APPLICATION_REVIEW',
          relatedResourceType: 'ACTIVITY_APPLICATION',
          relatedResourceId: organization.id,
          title: '当前用户待办',
        },
        {
          assigneeId: otherAssignee.id,
          taskType: 'APPLICATION_REVIEW',
          relatedResourceType: 'ACTIVITY_APPLICATION',
          relatedResourceId: organization.id,
          title: '其他用户待办',
        },
      ],
    })

    const res = await request(createApp())
      .get('/api/v1/pending-tasks/me')
      .set('Authorization', `Bearer ${assignee.accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].title).toBe('当前用户待办')
    expect(res.body.data[0].ownerId).toBe(assignee.id)
  })

  it('filters pending tasks by status', async () => {
    const assignee = await registerTestUser({
      username: 'filtered_assignee',
      userType: 'teacher',
      realName: '筛选待办处理人',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_TASK_FILTER_RESOURCE',
      name: '待办筛选资源组织',
      type: 'CLUB',
    })
    await prisma.pendingTask.createMany({
      data: [
        {
          assigneeId: assignee.id,
          taskType: 'APPLICATION_REVIEW',
          relatedResourceType: 'ACTIVITY_APPLICATION',
          relatedResourceId: organization.id,
          title: '待处理立项待办',
          status: 'PENDING',
        },
        {
          assigneeId: assignee.id,
          taskType: 'APPLICATION_REVIEW',
          relatedResourceType: 'ACTIVITY_APPLICATION',
          relatedResourceId: organization.id,
          title: '已处理立项待办',
          status: 'PROCESSED',
        },
      ],
    })

    const res = await request(createApp())
      .get('/api/v1/pending-tasks/me')
      .query({
        status: 'PENDING',
      })
      .set('Authorization', `Bearer ${assignee.accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].title).toBe('待处理立项待办')
  })

  it('returns pending task detail for assignee', async () => {
    const assignee = await registerTestUser({
      username: 'detail_assignee',
      userType: 'teacher',
      realName: '详情待办处理人',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_TASK_DETAIL_RESOURCE',
      name: '待办详情资源组织',
      type: 'CLUB',
    })
    const task = await prisma.pendingTask.create({
      data: {
        assigneeId: assignee.id,
        taskType: 'APPLICATION_REVIEW',
        relatedResourceType: 'ACTIVITY_APPLICATION',
        relatedResourceId: organization.id,
        title: '待办详情',
      },
    })

    const res = await request(createApp())
      .get(`/api/v1/pending-tasks/${task.id}`)
      .set('Authorization', `Bearer ${assignee.accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(task.id)
    expect(res.body.data.title).toBe('待办详情')
    expect(res.body.data.ownerId).toBe(assignee.id)
  })

  it('rejects pending task detail for non-assignee', async () => {
    const assignee = await registerTestUser({
      username: 'fd_assignee',
      userType: 'teacher',
      realName: '详情待办处理人',
    })
    const viewer = await registerTestUser({
      username: 'fd_viewer',
      userType: 'teacher',
      realName: '无权查看人',
    })
    const organization = await createTestOrganization({
      orgCode: 'TASK_FD',
      name: '无权详情资源组织',
      type: 'CLUB',
    })
    const task = await prisma.pendingTask.create({
      data: {
        assigneeId: assignee.id,
        taskType: 'APPLICATION_REVIEW',
        relatedResourceType: 'ACTIVITY_APPLICATION',
        relatedResourceId: organization.id,
        title: '无权查看待办',
      },
    })

    const res = await request(createApp())
      .get(`/api/v1/pending-tasks/${task.id}`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('processes pending task for assignee', async () => {
    const assignee = await registerTestUser({
      username: 'process_assignee',
      userType: 'teacher',
      realName: '待办处理人',
    })
    const organization = await createTestOrganization({
      orgCode: 'TEST_TASK_PROCESS_RESOURCE',
      name: '待办处理资源组织',
      type: 'CLUB',
    })
    const task = await prisma.pendingTask.create({
      data: {
        assigneeId: assignee.id,
        taskType: 'APPLICATION_REVIEW',
        relatedResourceType: 'ACTIVITY_APPLICATION',
        relatedResourceId: organization.id,
        title: '可处理待办',
      },
    })

    const res = await request(createApp())
      .patch(`/api/v1/pending-tasks/${task.id}/process`)
      .set('Authorization', `Bearer ${assignee.accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('PROCESSED')
    expect(res.body.data.processedAt).toBeTruthy()
  })

  it('rejects pending task process for non-assignee', async () => {
    const assignee = await registerTestUser({
      username: 'fp_assignee',
      userType: 'teacher',
      realName: '待办处理人',
    })
    const viewer = await registerTestUser({
      username: 'fp_viewer',
      userType: 'teacher',
      realName: '无权处理人',
    })
    const organization = await createTestOrganization({
      orgCode: 'TASK_FP',
      name: '无权处理资源组织',
      type: 'CLUB',
    })
    const task = await prisma.pendingTask.create({
      data: {
        assigneeId: assignee.id,
        taskType: 'APPLICATION_REVIEW',
        relatedResourceType: 'ACTIVITY_APPLICATION',
        relatedResourceId: organization.id,
        title: '无权处理待办',
      },
    })

    const res = await request(createApp())
      .patch(`/api/v1/pending-tasks/${task.id}/process`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('rejects repeated pending task processing', async () => {
    const assignee = await registerTestUser({
      username: 'repeat_assignee',
      userType: 'teacher',
      realName: '重复处理人',
    })
    const organization = await createTestOrganization({
      orgCode: 'TASK_RP',
      name: '重复处理资源组织',
      type: 'CLUB',
    })
    const task = await prisma.pendingTask.create({
      data: {
        assigneeId: assignee.id,
        taskType: 'APPLICATION_REVIEW',
        relatedResourceType: 'ACTIVITY_APPLICATION',
        relatedResourceId: organization.id,
        title: '重复处理待办',
      },
    })

    await request(createApp())
      .patch(`/api/v1/pending-tasks/${task.id}/process`)
      .set('Authorization', `Bearer ${assignee.accessToken}`)

    const res = await request(createApp())
      .patch(`/api/v1/pending-tasks/${task.id}/process`)
      .set('Authorization', `Bearer ${assignee.accessToken}`)

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })

  it('rejects unsupported pending task query filters', async () => {
    const assignee = await registerTestUser({
      username: 'invalid_filter',
      userType: 'teacher',
      realName: '非法筛选用户',
    })

    const res = await request(createApp())
      .get('/api/v1/pending-tasks/me')
      .query({ status: 'DONE' })
      .set('Authorization', `Bearer ${assignee.accessToken}`)

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})
