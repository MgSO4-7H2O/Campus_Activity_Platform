import type { ErrorRequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

import { AppError } from '../errors/app-error.js'
import { fail } from '../utils/response.js'

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json(
      fail('VALIDATION_ERROR', '请求参数校验失败', {
        issues: err.issues,
      })
    )
    return
  }

  if (err instanceof AppError) {
    res.status(err.status).json(fail(err.code, err.message, err.details))
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json(
        fail('CONFLICT', '唯一约束冲突', {
          target: err.meta?.target,
        })
      )
      return
    }
  }

  const message = err instanceof Error ? err.message : 'Unknown error'
  res.status(500).json(fail('INTERNAL_SERVER_ERROR', message))
}
