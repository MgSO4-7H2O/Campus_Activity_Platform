import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { announcementsService } from './announcements.service.js'
import { listAnnouncementsQuerySchema, upsertAnnouncementSchema } from './announcements.schemas.js'

const router: ExpressRouter = Router()
const idSchema = z.string().uuid()

router.get('/', async (req, res, next) => {
  try {
    const query = listAnnouncementsQuerySchema.parse(req.query)
    const data = await announcementsService.listAnnouncements(query)
    res.json(ok(data.items, data.meta))
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await announcementsService.getAnnouncement(id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = upsertAnnouncementSchema.parse(req.body)
    const data = await announcementsService.createAnnouncement(req.auth!.userId, body)
    res.status(201).json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = upsertAnnouncementSchema.partial().parse(req.body)
    const id = idSchema.parse(req.params.id)
    const data = await announcementsService.updateAnnouncement(req.auth!.userId, id, body)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/:id/publish', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await announcementsService.publishAnnouncement(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/:id/archive', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await announcementsService.archiveAnnouncement(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router

