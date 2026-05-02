import type { Role, StudentProfile, TeacherProfile, User, UserRole } from '@prisma/client'

import { AppError, notFound } from '../../shared/errors/app-error.js'
import { usersRepository } from './users.repository.js'
import type {
  UpdateMeBody,
  UpdateStudentProfileBody,
  UpdateTeacherProfileBody,
} from './users.schemas.js'

type UserWithExtras = User & {
  userRoles: (UserRole & { role: Role })[]
  studentProfile: StudentProfile | null
  teacherProfile: TeacherProfile | null
}

/**
 * 将数据库用户对象转换为前端使用的用户信息 DTO。
 */
function toUserDto(user: UserWithExtras) {
  return {
    id: user.id,
    username: user.username,
    realName: user.realName,
    phone: user.phone,
    email: user.email,
    userType: user.userType,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.userRoles.map((r) => r.role.code),
    studentProfile: user.studentProfile,
    teacherProfile: user.teacherProfile,
  }
}

export const usersService = {
  async getMe(userId: string) {
    const user = await usersRepository.findUserById(userId)
    if (!user) throw notFound('用户不存在')
    return toUserDto(user)
  },

  async updateMe(userId: string, body: UpdateMeBody) {
    const user = await usersRepository.updateUserById(userId, body)
    return toUserDto(user)
  },

  async updateMyProfile(
    userId: string,
    body: UpdateStudentProfileBody | UpdateTeacherProfileBody
  ) {
    const user = await usersRepository.findUserById(userId)
    if (!user) throw notFound('用户不存在')

    if (user.userType === 'STUDENT') {
      const studentBody = body as UpdateStudentProfileBody
      await usersRepository.upsertStudentProfile(userId, studentBody)

      const updated = await usersRepository.findUserById(userId)
      if (!updated) throw notFound('用户不存在')

      return toUserDto(updated)
    }

    if (user.userType === 'TEACHER') {
      const teacherBody = body as UpdateTeacherProfileBody
      await usersRepository.upsertTeacherProfile(userId, teacherBody)

      const updated = await usersRepository.findUserById(userId)
      if (!updated) throw notFound('用户不存在')

      return toUserDto(updated)
    }

    throw new AppError(400, 'BAD_REQUEST', '未知用户类型')
  },

  async getMyRoles(userId: string) {
    const user = await usersRepository.findUserById(userId)
    if (!user) throw notFound('用户不存在')

    return user.userRoles.map((r) => r.role.code)
  },
}