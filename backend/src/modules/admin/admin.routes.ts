import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { adminService } from './admin.service.js'
import { reviewRoleApplicationSchema, updateUserStatusSchema } from './admin.schemas.js'

const router: ExpressRouter = Router()
const routeIdSchema = z.string().uuid()

/**
 * @swagger
 * /api/v1/admin/role-applications:
 *   post:
 *     summary: 提交权限申请
 *     description: 普通用户申请 ORGANIZER / REVIEWER / SYS_ADMIN。
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 */
router.get('/role-applications', requireAuth, async (req, res, next) => {
  try {
    const data = await adminService.listRoleApplications(req.auth!.userId, req.query)
    res.json(ok(data.items, data.meta))
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/admin/role-applications/{id}/review:
 *   post:
 *     summary: 审核权限申请
 *     description: SYS_ADMIN 审核权限申请，通过后系统赋权。
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 */
router.post('/role-applications/:id/review', requireAuth, async (req, res, next) => {
  try {
    const body = reviewRoleApplicationSchema.parse(req.body)
    const applicationId = routeIdSchema.parse(req.params.id)
    const data = await adminService.reviewRoleApplication(req.auth!.userId, applicationId, body)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.get('/users', requireAuth, async (req, res, next) => {
  try {
    const data = await adminService.listUsers(req.auth!.userId, req.query)
    res.json(ok(data.items, data.meta))
  } catch (error) {
    next(error)
  }
})

router.get('/users/:id', requireAuth, async (req, res, next) => {
  try {
    const id = routeIdSchema.parse(req.params.id)
    const data = await adminService.getUserById(req.auth!.userId, id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.patch('/users/:id/status', requireAuth, async (req, res, next) => {
  try {
    const body = updateUserStatusSchema.parse(req.body)
    const id = routeIdSchema.parse(req.params.id)
    const data = await adminService.updateUserStatus(req.auth!.userId, id, body.status)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.get('/system-logs', requireAuth, async (req, res, next) => {
  try {
    const data = await adminService.listSystemLogs(req.auth!.userId, req.query)
    res.json(ok(data.items, data.meta))
  } catch (error) {
    next(error)
  }
})

router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const data = await adminService.getDashboard(req.auth!.userId)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router
