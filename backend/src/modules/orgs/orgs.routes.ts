import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { orgsService } from './orgs.service.js'
import {
  addUserOrganizationSchema,
  createOrganizationSchema,
  listOrganizationsQuerySchema,
  updateOrganizationSchema,
} from './orgs.schemas.js'

const router: ExpressRouter = Router()
const idSchema = z.string().uuid()

router.get('/organizations', async (req, res, next) => {
  try {
    const query = listOrganizationsQuerySchema.parse(req.query)
    const data = await orgsService.listOrganizations(query)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.get('/organizations/tree', async (_req, res, next) => {
  try {
    const data = await orgsService.getOrganizationTree()
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.get('/organizations/:id', async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id)
    const data = await orgsService.getOrganizationById(id)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/admin/organizations', requireAuth, async (req, res, next) => {
  try {
    const body = createOrganizationSchema.parse(req.body)
    const data = await orgsService.createOrganization(req.auth!.userId, body)
    res.status(201).json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.patch('/admin/organizations/:id', requireAuth, async (req, res, next) => {
  try {
    const body = updateOrganizationSchema.parse(req.body)
    const id = idSchema.parse(req.params.id)
    const data = await orgsService.updateOrganization(req.auth!.userId, id, body)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.post('/admin/users/:id/organizations', requireAuth, async (req, res, next) => {
  try {
    const targetUserId = idSchema.parse(req.params.id)
    const body = addUserOrganizationSchema.parse(req.body)
    const data = await orgsService.addUserOrganization(req.auth!.userId, targetUserId, body)
    res.status(201).json(ok(data))
  } catch (error) {
    next(error)
  }
})

router.delete('/admin/users/:id/organizations/:organizationId', requireAuth, async (req, res, next) => {
  try {
    const targetUserId = idSchema.parse(req.params.id)
    const organizationId = idSchema.parse(req.params.organizationId)
    await orgsService.removeUserOrganization(req.auth!.userId, targetUserId, organizationId)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

router.get('/admin/users/:id/organizations', requireAuth, async (req, res, next) => {
  try {
    const targetUserId = idSchema.parse(req.params.id)
    const data = await orgsService.listUserOrganizations(req.auth!.userId, targetUserId)
    res.json(ok(data))
  } catch (error) {
    next(error)
  }
})

export default router

