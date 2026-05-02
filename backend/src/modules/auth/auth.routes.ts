import { Router, type Router as ExpressRouter } from 'express'

import { ok } from '../../shared/utils/response.js'
import { authService } from './auth.service.js'
import { loginBodySchema, registerBodySchema } from './auth.schemas.js'

const router: ExpressRouter = Router()

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: 用户注册
 *     description: 注册学生或教师账号。注册成功后默认授予 BASIC_USER 角色，并返回 accessToken。
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - userType
 *               - realName
 *             properties:
 *               username:
 *                 type: string
 *                 description: 学号或工号，系统内唯一
 *                 minLength: 3
 *                 maxLength: 20
 *                 example: student2
 *               password:
 *                 type: string
 *                 format: password
 *                 description: 登录密码
 *                 minLength: 8
 *                 maxLength: 72
 *                 example: Password123!
 *               userType:
 *                 type: string
 *                 description: 用户身份类型
 *                 enum:
 *                   - student
 *                   - teacher
 *                 example: student
 *               realName:
 *                 type: string
 *                 description: 真实姓名
 *                 maxLength: 50
 *                 example: 测试学生2
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱，可选
 *                 maxLength: 100
 *                 example: student2@example.com
 *               phone:
 *                 type: string
 *                 description: 手机号，可选
 *                 maxLength: 20
 *                 example: "13800000002"
 *           examples:
 *             student:
 *               summary: 学生注册示例
 *               value:
 *                 username: student2
 *                 password: Password123!
 *                 userType: student
 *                 realName: 测试学生2
 *                 email: student2@example.com
 *                 phone: "13800000002"
 *             teacher:
 *               summary: 教师注册示例
 *               value:
 *                 username: teacher2
 *                 password: Password123!
 *                 userType: teacher
 *                 realName: 测试教师2
 *                 email: teacher2@example.com
 *                 phone: "13800000003"
 *     responses:
 *       201:
 *         description: 注册成功
 *       400:
 *         description: 请求参数校验失败
 *       409:
 *         description: 用户名、邮箱或手机号冲突
 */
router.post('/register', async (req, res) => {
  const body = registerBodySchema.parse(req.body)
  const data = await authService.register(body)
  res.status(201).json(ok(data))
})

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: 用户登录
 *     description: 使用学号/工号和密码登录。登录成功后返回 accessToken。
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 学号或工号
 *                 example: student1
 *               password:
 *                 type: string
 *                 format: password
 *                 description: 登录密码
 *                 example: Password123!
 *           examples:
 *             student:
 *               summary: 学生登录示例
 *               value:
 *                 username: student1
 *                 password: Password123!
 *             organizer:
 *               summary: 活动负责人登录示例
 *               value:
 *                 username: organizer1
 *                 password: Password123!
 *             reviewer:
 *               summary: 审核人登录示例
 *               value:
 *                 username: reviewer1
 *                 password: Password123!
 *             admin:
 *               summary: 系统管理员登录示例
 *               value:
 *                 username: admin
 *                 password: Password123!
 *     responses:
 *       200:
 *         description: 登录成功
 *       400:
 *         description: 请求参数校验失败
 *       401:
 *         description: 用户名或密码错误
 */
router.post('/login', async (req, res) => {
  const body = loginBodySchema.parse(req.body)
  const data = await authService.login(body)
  res.json(ok(data))
})

export default router