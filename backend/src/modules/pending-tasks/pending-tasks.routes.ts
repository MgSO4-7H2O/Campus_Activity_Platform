import { Router, type Router as ExpressRouter } from 'express'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { pendingTasksService } from './pending-tasks.service.js'
import { pendingTaskIdParamSchema, pendingTaskQuerySchema } from './pending-tasks.schemas.js'
import { forbidden } from '../../shared/errors/app-error.js'

const router: ExpressRouter = Router()

router.get('/pending-tasks/me', requireAuth, async (req, res, next) => {
  try {
    const query = pendingTaskQuerySchema.parse(req.query)
    const data = await pendingTasksService.listMyTasks(req.auth!.userId, query.status)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.get('/pending-tasks/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = pendingTaskIdParamSchema.parse(req.params)
    const data = await pendingTasksService.getTaskById(id)
    if (data.ownerId !== req.auth!.userId) {
      throw forbidden('无权查看该待办')
    }
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.patch('/pending-tasks/:id/process', requireAuth, async (req, res, next) => {
  try {
    const { id } = pendingTaskIdParamSchema.parse(req.params)
    const existing = await pendingTasksService.getTaskById(id)
    if (existing.ownerId !== req.auth!.userId) {
      throw forbidden('无权处理该待办')
    }
    const data = await pendingTasksService.markProcessed(id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router
