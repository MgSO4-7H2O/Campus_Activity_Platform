import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { uploadSingle } from '../../shared/utils/uploads.js'
import { signupsService } from './signups.service.js'
import { createSignupSchema, reviewSignupSchema } from './signups.schemas.js'

const router: ExpressRouter = Router()
const idSchema = z.string().uuid()

router.post('/recruitments/:id/signups', requireAuth, async (req, res, next) => {
  try {
    const recruitmentId = idSchema.parse(req.params.id)
    createSignupSchema.parse(req.body)
    const data = await signupsService.createSignup(req.auth!.userId, recruitmentId)
    res.status(201).json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.get('/signups/me', requireAuth, async (req, res, next) => {
  try {
    const data = await signupsService.listMySignups(req.auth!.userId, req.query)
    res.json(ok(data.items, data.meta))
  } catch (error) {
    next(error)
  }
})

router.get('/recruitments/:id/signups', requireAuth, async (req, res, next) => {
  try {
    const recruitmentId = idSchema.parse(req.params.id)
    const data = await signupsService.listSignupsByRecruitment(req.auth!.userId, recruitmentId, req.query)
    res.json(ok(data.items, data.meta))
  } catch (error) {
    next(error)
  }
})

router.get('/signups/:id', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await signupsService.getSignupById(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/signups/:id/review', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const body = reviewSignupSchema.parse(req.body)
    const data = await signupsService.reviewSignup(req.auth!.userId, id, body)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/signups/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await signupsService.cancelSignup(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/signups/:id/attachments', requireAuth, uploadSingle, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await signupsService.addAttachment(req.auth!.userId, id, req.file)
    res.status(201).json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router
