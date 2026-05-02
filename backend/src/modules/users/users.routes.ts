import { Router, type Router as ExpressRouter } from 'express'

import { requireAuth } from '../../shared/middleware/auth.js'
import { ok } from '../../shared/utils/response.js'
import { usersService } from './users.service.js'
import {
  updateMeBodySchema,
  updateStudentProfileBodySchema,
  updateTeacherProfileBodySchema,
} from './users.schemas.js'

const router: ExpressRouter = Router()

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: 获取当前登录用户信息
 *     description: 返回当前登录用户的基础信息、身份类型、角色列表以及对应的学生/教师扩展信息。
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未登录、缺少 Token 或 Token 无效
 */
router.get('/me', requireAuth, async (req, res) => {
  const data = await usersService.getMe(req.auth!.userId)
  res.json(ok(data))
})

/**
 * @swagger
 * /api/v1/users/me:
 *   patch:
 *     summary: 修改当前用户基础信息
 *     description: 修改当前登录用户的真实姓名、邮箱或手机号。不能修改 username、userType、status、roles 等敏感字段。
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               realName:
 *                 type: string
 *                 description: 真实姓名
 *                 example: 新测试用户
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱
 *                 example: new@example.com
 *               phone:
 *                 type: string
 *                 description: 手机号
 *                 example: "13800000009"
 *           examples:
 *             updateEmail:
 *               summary: 修改邮箱
 *               value:
 *                 email: new@example.com
 *             updatePhone:
 *               summary: 修改手机号
 *               value:
 *                 phone: "13800000009"
 *             updateRealName:
 *               summary: 修改真实姓名
 *               value:
 *                 realName: 新测试用户
 *     responses:
 *       200:
 *         description: 修改成功
 *       400:
 *         description: 请求参数校验失败
 *       401:
 *         description: 未登录、缺少 Token 或 Token 无效
 *       409:
 *         description: 邮箱或手机号唯一约束冲突
 */
router.patch('/me', requireAuth, async (req, res) => {
  const body = updateMeBodySchema.parse(req.body)
  const data = await usersService.updateMe(req.auth!.userId, body)
  res.json(ok(data))
})

/**
 * @swagger
 * /api/v1/users/me/profile:
 *   patch:
 *     summary: 修改当前用户扩展信息
 *     description: 根据当前用户身份类型修改学生或教师扩展信息。学生可修改学院、专业、年级、班级；教师可修改所属部门和职称。
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 description: 学生扩展信息
 *                 properties:
 *                   college:
 *                     type: string
 *                     description: 学院
 *                     example: 计算机学院
 *                   major:
 *                     type: string
 *                     description: 专业
 *                     example: 软件工程
 *                   grade:
 *                     type: integer
 *                     description: 年级或入学年份
 *                     example: 2026
 *                   className:
 *                     type: string
 *                     description: 班级
 *                     example: 1班
 *               - type: object
 *                 description: 教师扩展信息
 *                 properties:
 *                   departmentName:
 *                     type: string
 *                     description: 所属部门
 *                     example: 计算机学院
 *                   jobTitle:
 *                     type: string
 *                     description: 职称
 *                     example: 讲师
 *           examples:
 *             studentProfile:
 *               summary: 学生扩展信息示例
 *               value:
 *                 college: 计算机学院
 *                 major: 软件工程
 *                 grade: 2026
 *                 className: 1班
 *             teacherProfile:
 *               summary: 教师扩展信息示例
 *               value:
 *                 departmentName: 计算机学院
 *                 jobTitle: 讲师
 *     responses:
 *       200:
 *         description: 修改成功
 *       400:
 *         description: 请求参数校验失败
 *       401:
 *         description: 未登录、缺少 Token 或 Token 无效
 */
router.patch('/me/profile', requireAuth, async (req, res) => {
  const me = await usersService.getMe(req.auth!.userId)
  const body =
    me.userType === 'STUDENT'
      ? updateStudentProfileBodySchema.parse(req.body)
      : updateTeacherProfileBodySchema.parse(req.body)

  const data = await usersService.updateMyProfile(req.auth!.userId, body)
  res.json(ok(data))
})

/**
 * @swagger
 * /api/v1/users/me/roles:
 *   get:
 *     summary: 获取当前用户角色
 *     description: 返回当前登录用户拥有的角色代码列表，例如 BASIC_USER、ORGANIZER、REVIEWER、SYS_ADMIN。
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未登录、缺少 Token 或 Token 无效
 */
router.get('/me/roles', requireAuth, async (req, res) => {
  const data = await usersService.getMyRoles(req.auth!.userId)
  res.json(ok(data))
})

export default router