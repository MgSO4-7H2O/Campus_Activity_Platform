import type { RequestHandler } from 'express'

import { env } from '../../config/env.js'
import { verifyJwt } from '../auth/jwt.js'
import { unauthorized } from '../errors/app-error.js'

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

export const requireAuth: RequestHandler = (req, _res, next) => {
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

  try {
    const payload = verifyJwt(token, env.JWT_SECRET)
    req.auth = { userId: payload.sub }
    next()
  } catch {
    next(unauthorized('登录已过期或无效，请重新登录'))
  }
}

export {}
