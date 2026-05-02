import request from 'supertest'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import prisma from '../../shared/prisma/client.js'
import { createApp } from '../../app.js'

async function ensureBasicRole() {
  return prisma.role.upsert({
    where: { code: 'BASIC_USER' },
    update: {},
    create: { code: 'BASIC_USER', name: '基础用户' },
  })
}

async function registerAndLogin() {
  await request(createApp()).post('/api/v1/auth/register').send({
    username: 'user1',
    password: 'Password123!',
    userType: 'student',
    realName: '测试用户',
  })

  const loginRes = await request(createApp()).post('/api/v1/auth/login').send({
    username: 'user1',
    password: 'Password123!',
  })

  return loginRes.body?.data?.accessToken as string
}

describe('Users me APIs', () => {
  beforeAll(async () => {
    await ensureBasicRole()
  })

  beforeEach(async () => {
    await prisma.userRole.deleteMany()
    await prisma.studentProfile.deleteMany()
    await prisma.teacherProfile.deleteMany()
    await prisma.user.deleteMany()
  })

  it('updates user basic info', async () => {
    const token = await registerAndLogin()

    const res = await request(createApp())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'new@example.com' })

    expect(res.status).toBe(200)
    expect(res.body?.data?.email).toBe('new@example.com')
  })

  it('updates student profile', async () => {
    const token = await registerAndLogin()

    const res = await request(createApp())
      .patch('/api/v1/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ college: '计算机学院' })

    expect(res.status).toBe(200)
    expect(res.body?.data?.studentProfile?.college).toBe('计算机学院')
  })
})