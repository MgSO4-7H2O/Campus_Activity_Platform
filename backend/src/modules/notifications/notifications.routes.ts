import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { notificationsService } from './notifications.service.js'

const router: ExpressRouter = Router()
const idSchema = z.string().uuid()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const data = await notificationsService.listNotifications(req.auth!.userId, req.query)
    res.json(ok(data.items, data.meta))
  } catch (error) {
    next(error)
  }
})

router.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const count = await notificationsService.getUnreadCount(req.auth!.userId)
    res.json(ok({ count }))
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await notificationsService.markRead(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    await notificationsService.markAllRead(req.auth!.userId)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

export default router

