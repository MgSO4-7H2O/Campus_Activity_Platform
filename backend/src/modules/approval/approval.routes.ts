import { Router, type Router as ExpressRouter } from 'express'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { approvalService } from './approval.service.js'
import { reviewActivityApplicationSchema, routeIdSchema } from './approval.schemas.js'

const router: ExpressRouter = Router()

router.get('/approval/activity-applications/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = routeIdSchema.parse(req.params)
    const data = await approvalService.getActivityApplication(id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/approval/activity-applications/:id/review', requireAuth, async (req, res, next) => {
  try {
    const { id } = routeIdSchema.parse(req.params)
    const body = reviewActivityApplicationSchema.parse(req.body)
    const data = await approvalService.reviewActivityApplication(req.auth!.userId, id, body)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router
