import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import prisma from '../shared/prisma/client.js'
import { cleanupRealE2EUser } from './real-e2e-cleanup.js'
import { cleanupTestData, ensureCoreRoles, registerTestUser } from './fixtures.js'

describe('cleanupRealE2EUser', () => {
  beforeEach(async () => {
    await cleanupTestData()
    await ensureCoreRoles()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('删除真实 E2E 创建的用户及其学生 profile', async () => {
    const user = await registerTestUser({
      username: 'realcleanupuser',
      userType: 'student',
      realName: '真实联调清理用户',
    })

    await prisma.studentProfile.update({
      where: { userId: user.id },
      data: {
        college: '真实联调学院',
        major: '软件工程',
        grade: 2026,
        className: '联调2601',
      },
    })

    await cleanupRealE2EUser(user.username)

    const deletedUser = await prisma.user.findUnique({ where: { username: user.username } })
    const deletedProfile = await prisma.studentProfile.findUnique({ where: { userId: user.id } })

    expect(deletedUser).toBeNull()
    expect(deletedProfile).toBeNull()
  })
})
