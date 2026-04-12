import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

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

  const message = err instanceof Error ? err.message : 'Unknown error'
  res.status(500).json(fail('INTERNAL_SERVER_ERROR', message))
}

