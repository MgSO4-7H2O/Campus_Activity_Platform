import type { StudentProfile, TeacherProfile, User, UserRole, Role } from '@prisma/client'

import { env } from '../../config/env.js'
import { signJwt } from '../../shared/auth/jwt.js'
import { hashPassword, verifyPassword } from '../../shared/auth/password.js'
import { AppError, conflict, unauthorized } from '../../shared/errors/app-error.js'
import { authRepository } from './auth.repository.js'
import type { LoginBody, RegisterBody } from './auth.schemas.js'

const BASIC_USER_CODE = 'BASIC_USER'

type UserWithAuthRelations = User & {
  userRoles: (UserRole & { role: Role })[]
  studentProfile: StudentProfile | null
  teacherProfile: TeacherProfile | null
}

function toPrismaUserType(userType: RegisterBody['userType']) {
  return userType === 'student' ? 'STUDENT' : 'TEACHER'
}

/**
 * 过滤用户敏感信息，并整理角色列表给前端使用。
 */
function sanitizeUser(user: UserWithAuthRelations) {
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
  }
}

export const authService = {
  async register(body: RegisterBody) {
    const existed = await authRepository.findUserByUsername(body.username)
    if (existed) {
      throw conflict('用户名已存在')
    }

    const basicRole = await authRepository.upsertRoleByCode(BASIC_USER_CODE, '基础用户')
    const userType = toPrismaUserType(body.userType)
    const passwordHash = await hashPassword(body.password)

    const user =
      userType === 'STUDENT'
        ? await authRepository.createStudentUser({
            username: body.username,
            passwordHash,
            userType,
            realName: body.realName,
            phone: body.phone,
            email: body.email,
            basicRoleId: basicRole.id,
            profile: {},
          })
        : await authRepository.createTeacherUser({
            username: body.username,
            passwordHash,
            userType,
            realName: body.realName,
            phone: body.phone,
            email: body.email,
            basicRoleId: basicRole.id,
            profile: {},
          })

    const accessToken = signJwt({ sub: user.id }, env.JWT_SECRET, env.JWT_ACCESS_TOKEN_TTL_SECONDS)

    return {
      accessToken,
      user: sanitizeUser(user),
    }
  },

  async login(body: LoginBody) {
    const user = await authRepository.findUserByUsername(body.username)
    if (!user) {
      throw unauthorized('用户名或密码错误')
    }

    const ok = await verifyPassword(body.password, user.passwordHash)
    if (!ok) {
      throw unauthorized('用户名或密码错误')
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'USER_INACTIVE', '用户状态不可用')
    }

    const accessToken = signJwt({ sub: user.id }, env.JWT_SECRET, env.JWT_ACCESS_TOKEN_TTL_SECONDS)

    return {
      accessToken,
      user: sanitizeUser(user),
    }
  },
}