import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { roleApplicationsService } from './role-applications.service.js'
import { createRoleApplicationSchema, reviewRoleApplicationSchema } from './role-applications.schemas.js'

const router: ExpressRouter = Router()
const routeIdSchema = z.string().uuid()

const paginationSchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
  pageSize: z.string().optional().transform(val => (val ? parseInt(val, 10) : 10))
})


/**
 * @swagger
 * /api/v1/role-applications:
 *   post:
 *     summary: 提交权限申请
 *     description: 普通用户申请 ORGANIZER / REVIEWER / SYS_ADMIN。
 *     tags:
 *       - Role Applications
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = createRoleApplicationSchema.parse(req.body)
    const data = await roleApplicationsService.createApplication(req.auth!.userId, body)
    res.status(201).json(ok(data))
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/role-applications/me:
 *   get:
 *     summary: 查询我的权限申请
 *     tags:
 *       - Role Applications
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const data = await roleApplicationsService.getMyApplications(req.auth!.userId)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/role-applications/{id}:
 *   get:
 *     summary: 查询权限申请详情
 *     tags:
 *       - Role Applications
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = routeIdSchema.parse(req.params.id)
    const data = await roleApplicationsService.getApplicationById(id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/role-applications/{id}/review:
 *   post:
 *     summary: 审核权限申请
 *     description: SYS_ADMIN 审核权限申请，通过后系统赋权。
 *     tags:
 *       - Role Applications
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/review', requireAuth, async (req, res, next) => {
  try {
    const body = reviewRoleApplicationSchema.parse(req.body)
    const applicationId = routeIdSchema.parse(req.params.id)
    const data = await roleApplicationsService.reviewRoleApplication(req.auth!.userId, applicationId, body)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router