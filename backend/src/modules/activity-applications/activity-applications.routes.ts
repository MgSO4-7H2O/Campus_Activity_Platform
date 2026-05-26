import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { uploadSingle } from '../../shared/utils/uploads.js'
import { activityApplicationsService } from './activity-applications.service.js'
import { createActivityApplicationSchema, updateActivityApplicationSchema } from './activity-applications.schemas.js'

const router: ExpressRouter = Router()
const routeIdSchema = z.string().uuid()

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = createActivityApplicationSchema.parse(req.body)
    const data = await activityApplicationsService.createApplication(req.auth!.userId, body)
    res.status(201).json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const data = await activityApplicationsService.getMyApplications(req.auth!.userId, req.query)
    res.json(ok(data.items, data.meta))
  } catch (error) {
    next(error)
  }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const applicationId = routeIdSchema.parse(req.params.id)
    const data = await activityApplicationsService.getApplicationById(applicationId, req.auth!.userId)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = updateActivityApplicationSchema.parse(req.body)
    const applicationId = routeIdSchema.parse(req.params.id)
    const data = await activityApplicationsService.updateApplication(applicationId, req.auth!.userId, body)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/:id/attachments', requireAuth, uploadSingle, async (req, res, next) => {
  try {
    const applicationId = routeIdSchema.parse(req.params.id)
    const data = await activityApplicationsService.addAttachment(applicationId, req.auth!.userId, req.file)
    res.status(201).json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.delete('/:id/attachments/:attachmentId', requireAuth, async (req, res, next) => {
  try {
    const applicationId = routeIdSchema.parse(req.params.id)
    const attachmentId = routeIdSchema.parse(req.params.attachmentId)
    await activityApplicationsService.removeAttachment(applicationId, req.auth!.userId, attachmentId)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

router.post('/:id/submit', requireAuth, async (req, res, next) => {
  try {
    const applicationId = routeIdSchema.parse(req.params.id)
    const data = await activityApplicationsService.submitApplication(applicationId, req.auth!.userId)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.get('/:id/approval-records', requireAuth, async (req, res, next) => {
  try {
    const applicationId = routeIdSchema.parse(req.params.id)
    const data = await activityApplicationsService.getApprovalRecords(applicationId)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router
