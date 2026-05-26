import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { recruitmentService } from './recruitment.service.js'
import { upsertRecruitmentSchema } from './recruitment.schemas.js'

const router: ExpressRouter = Router()
const idSchema = z.string().uuid()

router.post('/recruitments', requireAuth, async (req, res, next) => {
  try {
    const body = upsertRecruitmentSchema.parse(req.body)
    const data = await recruitmentService.createRecruitment(req.auth!.userId, body)
    res.status(201).json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.get('/recruitments', async (req, res, next) => {
  try {
    const data = await recruitmentService.listRecruitments(req.query)
    res.json(ok(data.items, data.meta))
  } catch (error) {
    next(error)
  }
})

router.get('/recruitments/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await recruitmentService.getRecruitmentById(id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.patch('/recruitments/:id', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const body = upsertRecruitmentSchema.partial().parse(req.body)
    const data = await recruitmentService.updateRecruitment(req.auth!.userId, id, body)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/recruitments/:id/publish', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await recruitmentService.publishRecruitment(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/recruitments/:id/close', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await recruitmentService.closeRecruitment(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router

