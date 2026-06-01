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
  email?: string
  phone?: string
}

async function registerAndLogin(input: RegisterAndLoginInput) {
  await request(createApp()).post('/api/v1/auth/register').send({
    username: input.username,
    password: 'Password123!',
    userType: input.userType,
    realName: input.realName,
    email: input.email,
    phone: input.phone,
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

  it('rejects email update when another user already owns it', async () => {
    await registerAndLogin({
      username: 'owner',
      userType: 'student',
      realName: '邮箱所有者',
      email: 'owned@example.com',
    })
    const token = await registerAndLogin({
      username: 'editor',
      userType: 'student',
      realName: '编辑用户',
      email: 'editor@example.com',
    })

    const res = await request(createApp())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'owned@example.com' })

    expect(res.status).toBe(409)
    expect(res.body?.error?.code).toBe('CONFLICT')
  })

  it('rejects phone update when another user already owns it', async () => {
    await registerAndLogin({
      username: 'owner',
      userType: 'student',
      realName: '手机所有者',
      phone: '13800000001',
    })
    const token = await registerAndLogin({
      username: 'editor',
      userType: 'student',
      realName: '编辑用户',
      phone: '13800000002',
    })

    const res = await request(createApp())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '13800000001' })

    expect(res.status).toBe(409)
    expect(res.body?.error?.code).toBe('CONFLICT')
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

  it('returns current user role codes', async () => {
    const token = await registerAndLogin({
      username: 'role_user',
      userType: 'student',
      realName: '角色用户',
    })
    const user = await prisma.user.findUniqueOrThrow({
      where: { username: 'role_user' },
    })
    const organizerRole = await prisma.role.upsert({
      where: { code: 'ORGANIZER' },
      update: {},
      create: { code: 'ORGANIZER', name: '组织者' },
    })
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: organizerRole.id,
      },
    })

    const res = await request(createApp())
      .get('/api/v1/users/me/roles')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toContain('BASIC_USER')
    expect(res.body.data).toContain('ORGANIZER')
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
