import { Router, type Router as ExpressRouter } from 'express'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { adminService } from './admin.service.js'
import { createRoleApplicationSchema, reviewRoleApplicationSchema } from './admin.schemas.js'

const router: ExpressRouter = Router()

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
router.post('/role-applications', requireAuth, async (req, res, next) => {
  try {
    const body = createRoleApplicationSchema.parse(req.body)
    const data = await adminService.submitRoleApplication(req.auth!.userId, body)
    res.status(201).json(ok(data))
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/admin/role-applications:
 *   get:
 *     summary: 查询权限申请列表
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 */
router.get('/role-applications', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.query
    // For now we don't enforce SYS_ADMIN check in this minimal skeleton, 
    // but in real app, we should.
    const data = await adminService.getRoleApplications(status as any)
    res.json(ok(data))
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
    const data = await adminService.reviewRoleApplication(req.auth!.userId, req.params.id, body)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router

