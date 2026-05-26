import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { uploadSingle } from '../../shared/utils/uploads.js'
import { closureService } from './closure.service.js'
import { reviewClosureSchema, upsertClosureSchema } from './closure.schemas.js'

const router: ExpressRouter = Router()
const idSchema = z.string().uuid()

router.post('/closure-applications', requireAuth, async (req, res, next) => {
  try {
    const body = upsertClosureSchema.parse(req.body)
    const data = await closureService.createClosure(req.auth!.userId, body)
    res.status(201).json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.get('/closure-applications/me', requireAuth, async (req, res, next) => {
  try {
    const data = await closureService.listMyClosures(req.auth!.userId, req.query)
    res.json(ok(data.items, data.meta))
  } catch (error) {
    next(error)
  }
})

router.get('/closure-applications/:id', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await closureService.getClosureById(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.patch('/closure-applications/:id', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const body = upsertClosureSchema.partial().parse(req.body)
    const data = await closureService.updateClosure(req.auth!.userId, id, body)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/closure-applications/:id/attachments', requireAuth, uploadSingle, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await closureService.addAttachment(req.auth!.userId, id, req.file)
    res.status(201).json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/closure-applications/:id/submit', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await closureService.submitClosure(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/closure-applications/:id/review', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const body = reviewClosureSchema.parse(req.body)
    const data = await closureService.reviewClosure(req.auth!.userId, id, body)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.get('/closure-applications/:id/review-records', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await closureService.getReviewRecords(id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router

