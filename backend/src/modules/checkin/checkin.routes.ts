import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { checkinService } from './checkin.service.js'
import { checkinCodeSchema, createCheckinSessionSchema, manualRecordSchema } from './checkin.schemas.js'

const router: ExpressRouter = Router()
const idSchema = z.string().uuid()

router.post('/checkin-sessions', requireAuth, async (req, res, next) => {
  try {
    const body = createCheckinSessionSchema.parse(req.body)
    const data = await checkinService.createSession(req.auth!.userId, body)
    res.status(201).json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.get('/activities/:id/checkin-sessions', requireAuth, async (req, res, next) => {
  try {
    const activityId = idSchema.parse(req.params.id)
    const data = await checkinService.listSessionsByActivity(activityId)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/checkin-sessions/:id/open', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await checkinService.openSession(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/checkin-sessions/:id/close', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await checkinService.closeSession(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/checkin-sessions/:id/checkin', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const body = checkinCodeSchema.parse(req.body)
    const data = await checkinService.checkin(req.auth!.userId, id, body.code)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.get('/checkin-sessions/:id/records', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await checkinService.listRecords(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/checkin-sessions/:id/manual-records', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const body = manualRecordSchema.parse(req.body)
    const data = await checkinService.addManualRecord(req.auth!.userId, id, body)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router

