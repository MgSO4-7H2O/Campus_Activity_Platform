import express, { type Application } from 'express'
import path from 'node:path'
import compression from 'compression'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'

import { env } from './config/env.js'
import { swaggerSpec } from './config/swagger.js'
import { errorHandler } from './shared/middleware/error.js'
import { fail } from './shared/utils/response.js'
import { registerRoutes } from './modules/index.js'

export function createApp(): Application {
  const app = express()

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(','),
      credentials: true,
    })
  )
  app.use(helmet())
  app.use(compression())
  app.use(morgan('dev'))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: '校园活动平台 API 文档',
    })
  )
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec))

  registerRoutes(app)

  app.use((_req, res) => res.status(404).json(fail('NOT_FOUND', 'Not Found')))
  app.use(errorHandler)

  return app
}

