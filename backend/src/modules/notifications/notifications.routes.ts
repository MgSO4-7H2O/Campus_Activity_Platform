import { Router } from 'express'

import { fail } from '../../shared/utils/response.js'

const router = Router()

router.all('*', (_req, res) => {
  res.status(501).json(fail('NOT_IMPLEMENTED', 'notifications 模块尚未实现'))
})

export default router

