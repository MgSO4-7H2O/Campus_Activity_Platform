import { pathToFileURL } from 'node:url'

import type { Role } from '@prisma/client'

import prisma from '../shared/prisma/client.js'
import { hashPassword } from '../shared/auth/password.js'

export type RealE2EActors = {
  adminUsername: string
  reviewerUsername: string
}

class InvalidRealE2EActorUsernameError extends Error {
  constructor(username: string) {
    super(`Refusing to create non-E2E actor username: ${username}`)
    this.name = 'InvalidRealE2EActorUsernameError'
  }
}

class MissingRealE2EActorUsernameError extends Error {
  constructor() {
    super('Missing admin or reviewer username for real E2E actors')
    this.name = 'MissingRealE2EActorUsernameError'
  }
}

function assertRealE2EActorUsername(username: string): void {
  if (!/^real[a-z0-9]+$/.test(username)) {
    throw new InvalidRealE2EActorUsernameError(username)
  }
}

function readActorUsernames(argv: string[]): RealE2EActors {
  const adminUsername = argv[2]
  const reviewerUsername = argv[3]
  if (!adminUsername || !reviewerUsername) {
    throw new MissingRealE2EActorUsernameError()
  }
  assertRealE2EActorUsername(adminUsername)
  assertRealE2EActorUsername(reviewerUsername)
  return { adminUsername, reviewerUsername }
}

function isCliEntry(argvEntry: string | undefined, moduleUrl: string): boolean {
  if (!argvEntry) {
    return false
  }
  return pathToFileURL(argvEntry).href === moduleUrl
}

async function ensureRole(code: string, name: string): Promise<Role> {
  return prisma.role.upsert({
    where: { code },
    update: {},
    create: { code, name },
  })
}

async function ensureTeacherActor(username: string, realName: string, role: Role): Promise<void> {
  const basicRole = await ensureRole('BASIC_USER', '基础用户')
  const passwordHash = await hashPassword('Password123!')
  const user = await prisma.user.upsert({
    where: { username },
    update: {
      realName,
      passwordHash,
      userType: 'TEACHER',
      status: 'ACTIVE',
    },
    create: {
      username,
      realName,
      passwordHash,
      userType: 'TEACHER',
      status: 'ACTIVE',
    },
  })

  await prisma.teacherProfile.upsert({
    where: { userId: user.id },
    update: {
      departmentName: '真实联调测试部',
      jobTitle: '测试账号',
    },
    create: {
      userId: user.id,
      departmentName: '真实联调测试部',
      jobTitle: '测试账号',
    },
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: basicRole.id } },
    update: {},
    create: { userId: user.id, roleId: basicRole.id },
  })
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  })
}

export async function ensureRealE2EActors(actors: RealE2EActors): Promise<RealE2EActors> {
  await ensureRole('ORGANIZER', '活动负责人')
  const adminRole = await ensureRole('SYS_ADMIN', '系统管理员')
  const reviewerRole = await ensureRole('REVIEWER', '审核人')

  await ensureTeacherActor(actors.adminUsername, '真实联调管理员', adminRole)
  await ensureTeacherActor(actors.reviewerUsername, '真实联调审核人', reviewerRole)

  return actors
}

if (isCliEntry(process.argv[1], import.meta.url)) {
  const result = await ensureRealE2EActors(readActorUsernames(process.argv))
  console.log(JSON.stringify(result))
  await prisma.$disconnect()
}
