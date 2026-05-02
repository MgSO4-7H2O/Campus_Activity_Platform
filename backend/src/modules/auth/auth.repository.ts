import type { UserType } from '@prisma/client'

import prisma from '../../shared/prisma/client.js'

export type StudentProfileCreateInput = {
  college?: string
  major?: string
  grade?: number
  className?: string
}

export type TeacherProfileCreateInput = {
  departmentName?: string
  jobTitle?: string
}

export type CreateUserInput = {
  username: string
  passwordHash: string
  userType: UserType
  realName: string
  phone?: string
  email?: string
  basicRoleId: string
}

export const authRepository = {
  findUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: { include: { role: true } },
        studentProfile: true,
        teacherProfile: true,
      },
    })
  },

  createStudentUser(input: CreateUserInput & { profile: StudentProfileCreateInput }) {
    return prisma.user.create({
      data: {
        username: input.username,
        passwordHash: input.passwordHash,
        userType: input.userType,
        status: 'ACTIVE',
        realName: input.realName,
        phone: input.phone,
        email: input.email,
        studentProfile: { create: input.profile },
        userRoles: { create: [{ roleId: input.basicRoleId }] },
      },
      include: {
        userRoles: { include: { role: true } },
        studentProfile: true,
        teacherProfile: true,
      },
    })
  },

  createTeacherUser(input: CreateUserInput & { profile: TeacherProfileCreateInput }) {
    return prisma.user.create({
      data: {
        username: input.username,
        passwordHash: input.passwordHash,
        userType: input.userType,
        status: 'ACTIVE',
        realName: input.realName,
        phone: input.phone,
        email: input.email,
        teacherProfile: { create: input.profile },
        userRoles: { create: [{ roleId: input.basicRoleId }] },
      },
      include: {
        userRoles: { include: { role: true } },
        studentProfile: true,
        teacherProfile: true,
      },
    })
  },

  upsertRoleByCode(code: string, name?: string) {
    return prisma.role.upsert({
      where: { code },
      update: name ? { name } : {},
      create: {
        code,
        name: name ?? code,
      },
    })
  },
}
