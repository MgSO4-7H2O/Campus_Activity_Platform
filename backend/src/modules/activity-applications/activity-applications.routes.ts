import { Router, type Router as ExpressRouter } from 'express'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { activityApplicationsService } from './activity-applications.service.js'
import { createActivityApplicationSchema, updateActivityApplicationSchema } from './activity-applications.schemas.js'

const router: ExpressRouter = Router()

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = createActivityApplicationSchema.parse(req.body)
    const data = await activityApplicationsService.createApplication(req.auth!.userId, body)
    res.status(201).json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const data = await activityApplicationsService.getMyApplications(req.auth!.userId)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = updateActivityApplicationSchema.parse(req.body)
    const data = await activityApplicationsService.updateApplication(req.params.id, req.auth!.userId, body)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/:id/submit', requireAuth, async (req, res, next) => {
  try {
    const data = await activityApplicationsService.submitApplication(req.params.id, req.auth!.userId)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router
