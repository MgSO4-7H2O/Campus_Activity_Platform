import type { RequestHandler } from 'express'

import { env } from '../../config/env.js'
import { verifyJwt } from '../auth/jwt.js'
import { forbidden, unauthorized } from '../errors/app-error.js'
import prisma from '../prisma/client.js'

declare global {
  // Express exposes Request augmentation through this namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: {
        userId: string
      }
    }
  }
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.header('authorization') ?? req.header('Authorization')
  if (!header) {
    next(unauthorized('缺少 Authorization Header'))
    return
  }

  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) {
    next(unauthorized('Authorization 格式错误（期望 Bearer <token>）'))
    return
  }

  let userId: string
  try {
    userId = verifyJwt(token, env.JWT_SECRET).sub
  } catch {
    next(unauthorized('登录已过期或无效，请重新登录'))
    return
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true },
  })

  if (!user) {
    next(unauthorized('登录用户不存在，请重新登录'))
    return
  }

  if (user.status !== 'ACTIVE') {
    next(forbidden('用户已被禁用'))
    return
  }

  req.auth = { userId: user.id }
  next()
}

export {}
