import { Router, type Router as ExpressRouter } from 'express'

const router: ExpressRouter = Router()

import { ok } from '../../shared/utils/response.js'

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/health', (_req, res) => {
  res.json(
    ok({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  )
})

export default router
