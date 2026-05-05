import { Router, type Router as ExpressRouter } from 'express'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { approvalService } from './approval.service.js'
import { getPendingTasksQuerySchema } from './approval.schemas.js'

const router: ExpressRouter = Router()

router.get('/pending-tasks', requireAuth, async (req, res, next) => {
  try {
    const query = getPendingTasksQuerySchema.parse(req.query)
    const data = await approvalService.getPendingTasks(req.auth!.userId, query.status, query.taskType)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router
