import request from 'supertest'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../../app.js'
import prisma from '../../shared/prisma/client.js'
import {
  cleanupTestData,
  ensureCoreRoles,
  grantRole,
  registerTestUser,
} from '../../test/fixtures.js'

describe('Announcement and notification APIs', () => {
  beforeAll(async () => {
    await ensureCoreRoles()
  })

  beforeEach(async () => {
    await cleanupTestData()
    await ensureCoreRoles()
  })

  it('publishes an announcement and creates unread receipts for basic users', async () => {
    const publisher = await registerTestUser({
      username: 'announcement_admin',
      userType: 'teacher',
      realName: '公告管理员',
    })
    await grantRole(publisher.id, 'SYS_ADMIN')
    const recipient = await registerTestUser({
      username: 'announcement_reader',
      userType: 'student',
      realName: '公告接收人',
    })

    const createRes = await request(createApp())
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${publisher.accessToken}`)
      .send({
        title: '系统维护通知',
        category: 'SYSTEM',
        content: '系统将在今晚进行维护。',
        pinned: true,
      })

    expect(createRes.status).toBe(201)
    expect(createRes.body.data.status).toBe('DRAFT')
    expect(createRes.body.data.category).toBe('SYSTEM')

    const publishRes = await request(createApp())
      .post(`/api/v1/announcements/${createRes.body.data.id}/publish`)
      .set('Authorization', `Bearer ${publisher.accessToken}`)

    expect(publishRes.status).toBe(200)
    expect(publishRes.body.data.status).toBe('PUBLISHED')
    expect(publishRes.body.data.publishedAt).toBeTruthy()

    const unreadRes = await request(createApp())
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${recipient.accessToken}`)

    expect(unreadRes.status).toBe(200)
    expect(unreadRes.body.data.count).toBe(1)

    const notificationsRes = await request(createApp())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${recipient.accessToken}`)

    expect(notificationsRes.status).toBe(200)
    expect(notificationsRes.body.data[0].type).toBe('ANNOUNCE')
    expect(notificationsRes.body.data[0].title).toBe('新公告：系统维护通知')

    const markReadRes = await request(createApp())
      .patch(`/api/v1/notifications/${notificationsRes.body.data[0].id}/read`)
      .set('Authorization', `Bearer ${recipient.accessToken}`)

    expect(markReadRes.status).toBe(200)
    expect(markReadRes.body.data.read).toBe(true)

    const unreadAfterReadRes = await request(createApp())
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${recipient.accessToken}`)

    expect(unreadAfterReadRes.status).toBe(200)
    expect(unreadAfterReadRes.body.data.count).toBe(0)
  })

  it('rejects announcement creation from a basic user', async () => {
    const user = await registerTestUser({
      username: 'announcement_basic',
      userType: 'student',
      realName: '普通公告用户',
    })

    const res = await request(createApp())
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: '普通用户公告',
        category: 'NOTICE',
        content: '普通用户不能发布公告。',
      })

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('filters notifications, marks all read, and rejects reading another user notification', async () => {
    const owner = await registerTestUser({
      username: 'notification_owner',
      userType: 'student',
      realName: '通知所有者',
    })
    const otherUser = await registerTestUser({
      username: 'notification_other',
      userType: 'student',
      realName: '通知其他用户',
    })
    const notification = await prisma.notification.create({
      data: {
        title: '测试通知',
        content: '测试通知内容',
        targetType: 'USER',
        sourceType: 'SYSTEM',
      },
    })
    const privateNotification = await prisma.notification.create({
      data: {
        title: '其他用户通知',
        content: '其他用户通知内容',
        targetType: 'USER',
        sourceType: 'SYSTEM',
      },
    })
    await prisma.notificationReceipt.createMany({
      data: [
        {
          notificationId: notification.id,
          userId: owner.id,
          isRead: false,
        },
        {
          notificationId: notification.id,
          userId: otherUser.id,
          isRead: false,
        },
        {
          notificationId: privateNotification.id,
          userId: otherUser.id,
          isRead: false,
        },
      ],
    })

    const unreadRes = await request(createApp())
      .get('/api/v1/notifications')
      .query({ read: 'false' })
      .set('Authorization', `Bearer ${owner.accessToken}`)

    expect(unreadRes.status).toBe(200)
    expect(unreadRes.body.data).toHaveLength(1)
    expect(unreadRes.body.data[0].read).toBe(false)

    const readOtherUserNotificationRes = await request(createApp())
      .patch(`/api/v1/notifications/${privateNotification.id}/read`)
      .set('Authorization', `Bearer ${owner.accessToken}`)

    expect(readOtherUserNotificationRes.status).toBe(404)
    expect(readOtherUserNotificationRes.body.error.code).toBe('NOT_FOUND')

    const markOneRes = await request(createApp())
      .patch(`/api/v1/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${owner.accessToken}`)

    expect(markOneRes.status).toBe(200)
    expect(markOneRes.body.data.recipientId).toBe(owner.id)

    await prisma.notificationReceipt.update({
      where: {
        notificationId_userId: {
          notificationId: notification.id,
          userId: owner.id,
        },
      },
      data: {
        isRead: false,
        readAt: null,
      },
    })

    const markAllRes = await request(createApp())
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${owner.accessToken}`)

    expect(markAllRes.status).toBe(204)

    const readRes = await request(createApp())
      .get('/api/v1/notifications')
      .query({ read: 'true' })
      .set('Authorization', `Bearer ${owner.accessToken}`)

    expect(readRes.status).toBe(200)
    expect(readRes.body.data).toHaveLength(1)
    expect(readRes.body.data[0].read).toBe(true)
  })
})
