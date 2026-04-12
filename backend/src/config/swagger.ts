import swaggerJSDoc from 'swagger-jsdoc'

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: '校园活动管理与报名签到平台 API',
      version: '0.1.0',
    },
  },
  apis: ['./src/**/*.ts'],
})

