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

describe('Auth flow', () => {
  beforeAll(async () => {
    await ensureBasicRole()
  })

  beforeEach(async () => {
    await cleanupTestData()
    await ensureBasicRole()
  })

  it('registers student user', async () => {
    const res = await request(createApp()).post('/api/v1/auth/register').send({
      username: 'user1',
      password: 'Password123!',
      userType: 'student',
      realName: '测试用户',
      email: 'user1@example.com',
    })

    expect(res.status).toBe(201)
    expect(res.body?.data?.accessToken).toBeTruthy()
    expect(res.body?.data?.user?.username).toBe('user1')
    expect(res.body?.data?.user?.roles).toContain('BASIC_USER')
  })

  it('registers teacher user', async () => {
    const res = await request(createApp()).post('/api/v1/auth/register').send({
      username: 'teacher1',
      password: 'Password123!',
      userType: 'teacher',
      realName: '测试教师',
      email: 'teacher1@example.com',
    })

    expect(res.status).toBe(201)
    expect(res.body?.data?.accessToken).toBeTruthy()
    expect(res.body?.data?.user?.username).toBe('teacher1')
    expect(res.body?.data?.user?.userType).toBe('TEACHER')
    expect(res.body?.data?.user?.roles).toContain('BASIC_USER')
    expect(res.body?.data?.user?.passwordHash).toBeUndefined()
  })

  it('rejects registration without realName', async () => {
    const res = await request(createApp()).post('/api/v1/auth/register').send({
      username: 'user1',
      password: 'Password123!',
      userType: 'student',
    })

    expect(res.status).toBe(400)
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR')
  })

  it('rejects registration with short username', async () => {
    const res = await request(createApp()).post('/api/v1/auth/register').send({
      username: 'u1',
      password: 'Password123!',
      userType: 'student',
      realName: '测试用户',
    })

    expect(res.status).toBe(400)
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR')
  })

  it('rejects duplicate username', async () => {
    await request(createApp()).post('/api/v1/auth/register').send({
      username: 'user1',
      password: 'Password123!',
      userType: 'student',
      realName: '测试用户',
    })

    const res = await request(createApp()).post('/api/v1/auth/register').send({
      username: 'user1',
      password: 'Password123!',
      userType: 'student',
      realName: '测试用户',
    })

    expect(res.status).toBe(409)
    expect(res.body?.error?.code).toBe('CONFLICT')
  })

  it('rejects duplicate email registration', async () => {
    await request(createApp()).post('/api/v1/auth/register').send({
      username: 'user1',
      password: 'Password123!',
      userType: 'student',
      realName: '测试用户',
      email: 'duplicate@example.com',
    })

    const res = await request(createApp()).post('/api/v1/auth/register').send({
      username: 'user2',
      password: 'Password123!',
      userType: 'teacher',
      realName: '测试教师',
      email: 'duplicate@example.com',
    })

    expect(res.status).toBe(409)
    expect(res.body?.error?.code).toBe('CONFLICT')
  })

  it('rejects duplicate phone registration', async () => {
    await request(createApp()).post('/api/v1/auth/register').send({
      username: 'user1',
      password: 'Password123!',
      userType: 'student',
      realName: '测试用户',
      phone: '13800000001',
    })

    const res = await request(createApp()).post('/api/v1/auth/register').send({
      username: 'user2',
      password: 'Password123!',
      userType: 'teacher',
      realName: '测试教师',
      phone: '13800000001',
    })

    expect(res.status).toBe(409)
    expect(res.body?.error?.code).toBe('CONFLICT')
  })

  it('logs in and gets /users/me', async () => {
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
    expect(loginRes.status).toBe(200)
    const token = loginRes.body?.data?.accessToken
    expect(token).toBeTruthy()

    const meRes = await request(createApp())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
    expect(meRes.status).toBe(200)
    expect(meRes.body?.data?.username).toBe('user1')
    expect(meRes.body?.data?.roles).toContain('BASIC_USER')
  })

  it('rejects wrong password', async () => {
    await request(createApp()).post('/api/v1/auth/register').send({
      username: 'user1',
      password: 'Password123!',
      userType: 'student',
      realName: '测试用户',
    })

    const res = await request(createApp()).post('/api/v1/auth/login').send({
      username: 'user1',
      password: 'WrongPassword!',
    })
    expect(res.status).toBe(401)
    expect(res.body?.error?.code).toBe('UNAUTHORIZED')
  })

  it('rejects banned user login', async () => {
    await request(createApp()).post('/api/v1/auth/register').send({
      username: 'user1',
      password: 'Password123!',
      userType: 'student',
      realName: '测试用户',
    })
    await prisma.user.update({
      where: { username: 'user1' },
      data: { status: 'BANNED' },
    })

    const res = await request(createApp()).post('/api/v1/auth/login').send({
      username: 'user1',
      password: 'Password123!',
    })

    expect(res.status).toBe(403)
    expect(res.body?.error?.code).toBe('USER_INACTIVE')
  })

  it('rejects existing token after user is banned', async () => {
    await request(createApp()).post('/api/v1/auth/register').send({
      username: 'ban_token_user',
      password: 'Password123!',
      userType: 'student',
      realName: '封禁令牌用户',
    })

    const loginRes = await request(createApp()).post('/api/v1/auth/login').send({
      username: 'ban_token_user',
      password: 'Password123!',
    })
    const token = loginRes.body?.data?.accessToken as string
    await prisma.user.update({
      where: { username: 'ban_token_user' },
      data: { status: 'BANNED' },
    })

    const res = await request(createApp())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
    expect(res.body?.error?.code).toBe('FORBIDDEN')
  })

  it('rejects /users/me when not logged in', async () => {
    const res = await request(createApp()).get('/api/v1/users/me')
    expect(res.status).toBe(401)
    expect(res.body?.error?.code).toBe('UNAUTHORIZED')
  })
})
