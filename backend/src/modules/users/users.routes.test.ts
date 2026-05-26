import request from 'supertest'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import prisma from '../../shared/prisma/client.js'
import { createApp } from '../../app.js'
import { cleanupTestData } from '../../test/fixtures.js'

async function ensureBasicRole() {
  return prisma.role.upsert({
    where: { code: 'BASIC_USER' },
    update: {},
    create: { code: 'BASIC_USER', name: '基础用户' },
  })
}

type RegisterAndLoginInput = {
  username: string
  userType: 'student' | 'teacher'
  realName: string
}

async function registerAndLogin(input: RegisterAndLoginInput) {
  await request(createApp()).post('/api/v1/auth/register').send({
    username: input.username,
    password: 'Password123!',
    userType: input.userType,
    realName: input.realName,
  })

  const loginRes = await request(createApp()).post('/api/v1/auth/login').send({
    username: input.username,
    password: 'Password123!',
  })

  return loginRes.body?.data?.accessToken as string
}

describe('Users me APIs', () => {
  beforeAll(async () => {
    await ensureBasicRole()
  })

  beforeEach(async () => {
    await cleanupTestData()
    await ensureBasicRole()
  })

  it('updates user basic info', async () => {
    const token = await registerAndLogin({
      username: 'user1',
      userType: 'student',
      realName: '测试用户',
    })

    const res = await request(createApp())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'new@example.com' })

    expect(res.status).toBe(200)
    expect(res.body?.data?.email).toBe('new@example.com')
  })

  it('rejects invalid email update', async () => {
    const token = await registerAndLogin({
      username: 'user1',
      userType: 'student',
      realName: '测试用户',
    })

    const res = await request(createApp())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'not-email' })

    expect(res.status).toBe(400)
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR')
  })

  it('rejects /users/me with invalid token', async () => {
    const res = await request(createApp())
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer invalid.token.value')

    expect(res.status).toBe(401)
    expect(res.body?.error?.code).toBe('UNAUTHORIZED')
  })

  it('updates student profile', async () => {
    const token = await registerAndLogin({
      username: 'user1',
      userType: 'student',
      realName: '测试用户',
    })

    const res = await request(createApp())
      .patch('/api/v1/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ college: '计算机学院' })

    expect(res.status).toBe(200)
    expect(res.body?.data?.studentProfile?.college).toBe('计算机学院')
  })

  it('updates teacher profile', async () => {
    const token = await registerAndLogin({
      username: 'teacher1',
      userType: 'teacher',
      realName: '测试教师',
    })

    const res = await request(createApp())
      .patch('/api/v1/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ departmentName: '计算机学院', jobTitle: '讲师' })

    expect(res.status).toBe(200)
    expect(res.body?.data?.teacherProfile?.departmentName).toBe('计算机学院')
    expect(res.body?.data?.teacherProfile?.jobTitle).toBe('讲师')
  })

  it('rejects non-number student grade', async () => {
    const token = await registerAndLogin({
      username: 'user1',
      userType: 'student',
      realName: '测试用户',
    })

    const res = await request(createApp())
      .patch('/api/v1/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ grade: 'not-a-number' })

    expect(res.status).toBe(400)
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR')
  })
})
