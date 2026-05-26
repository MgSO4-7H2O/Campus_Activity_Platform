import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { activitiesService } from './activities.service.js'
import { listActivitiesQuerySchema } from './activities.schemas.js'

const router: ExpressRouter = Router()
const idSchema = z.string().uuid()

router.get('/activities', async (req, res, next) => {
  try {
    const query = listActivitiesQuerySchema.parse(req.query)
    const data = await activitiesService.listActivities(query)
    res.json(ok(data.items, data.meta))
  } catch (error) {
    next(error)
  }
})

router.get('/activities/me', requireAuth, async (req, res, next) => {
  try {
    const data = await activitiesService.listMyActivities(req.auth!.userId)
    res.json(ok(data.items, data.meta))
  } catch (error) {
    next(error)
  }
})

router.get('/activities/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await activitiesService.getActivityById(id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/activities/:id/start', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await activitiesService.startActivity(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/activities/:id/finish', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await activitiesService.finishActivity(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router
