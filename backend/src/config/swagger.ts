import swaggerJSDoc from 'swagger-jsdoc'

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: '校园活动管理与报名签到平台 API',
      version: '0.1.0',
      description: '校园活动管理与报名签到平台后端接口文档',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '本地开发环境',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: '健康检查接口',
      },
      {
        name: 'Auth',
        description: '注册、登录相关接口',
      },
      {
        name: 'Users',
        description: '当前用户信息与角色接口',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/**/*.routes.ts'],
})