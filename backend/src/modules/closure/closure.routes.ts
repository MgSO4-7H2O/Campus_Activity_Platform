import { Router, type Router as ExpressRouter } from 'express'

const router: ExpressRouter = Router()

import { fail } from '../../shared/utils/response.js'

router.use((_req, res) => {
  res.status(501).json(fail('NOT_IMPLEMENTED', 'closure 模块尚未实现'))
})

export default router

