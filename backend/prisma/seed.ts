import { PrismaClient, UserStatus, UserType } from '@prisma/client'
import crypto from 'node:crypto'

const prisma = new PrismaClient()

function base64UrlEncode(buf: Buffer) {
  return buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

/**
 * 使用 scrypt 生成密码哈希。
 * 当前用于初始化测试账号，格式需要与登录校验逻辑保持一致。
 */
async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16)
  const keyLen = 32

  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, keyLen, (err, dk) => {
      if (err) reject(err)
      else resolve(dk as Buffer)
    })
  })

  return `scrypt$${base64UrlEncode(salt)}$${base64UrlEncode(derived)}`
}

async function main() {
  const password = 'Password123!'
  const passwordHash = await hashPassword(password)

  const basicRole = await prisma.role.upsert({
    where: { code: 'BASIC_USER' },
    update: {},
    create: {
      code: 'BASIC_USER',
      name: '基础用户',
      description: '普通学生或教师用户，可以报名活动、查看公告等',
    },
  })

  const organizerRole = await prisma.role.upsert({
    where: { code: 'ORGANIZER' },
    update: {},
    create: {
      code: 'ORGANIZER',
      name: '活动负责人',
      description: '可以发起活动立项、发布招募、审核报名和提交结项',
    },
  })

  const reviewerRole = await prisma.role.upsert({
    where: { code: 'REVIEWER' },
    update: {},
    create: {
      code: 'REVIEWER',
      name: '审核人',
      description: '负责审核活动立项和结项申请',
    },
  })

  const sysAdminRole = await prisma.role.upsert({
    where: { code: 'SYS_ADMIN' },
    update: {},
    create: {
      code: 'SYS_ADMIN',
      name: '系统管理员',
      description: '负责系统管理和权限申请审核',
    },
  })

  const defaultOrg = await prisma.organization.upsert({
    where: { orgCode: 'DEFAULT_ORG' },
    update: {},
    create: {
      orgCode: 'DEFAULT_ORG',
      name: '默认组织',
      type: 'ADMINISTRATION',
      status: 'ACTIVE',
      description: '用于本地开发和测试的默认组织',
    },
  })

  const student = await prisma.user.upsert({
    where: { username: 'student1' },
    update: {},
    create: {
      username: 'student1',
      realName: '测试学生',
      passwordHash,
      userType: UserType.STUDENT,
      status: UserStatus.ACTIVE,
      studentProfile: {
        create: {
          college: '默认学院',
          major: '默认专业',
          grade: 2026,
          className: '1班',
        },
      },
      userRoles: {
        create: [
          {
            roleId: basicRole.id,
          },
        ],
      },
    },
  })

  const organizer = await prisma.user.upsert({
    where: { username: 'organizer1' },
    update: {},
    create: {
      username: 'organizer1',
      realName: '测试负责人',
      passwordHash,
      userType: UserType.STUDENT,
      status: UserStatus.ACTIVE,
      studentProfile: {
        create: {
          college: '默认学院',
          major: '默认专业',
          grade: 2026,
          className: '2班',
        },
      },
      userRoles: {
        create: [
          {
            roleId: basicRole.id,
          },
          {
            roleId: organizerRole.id,
          },
        ],
      },
      userOrganizations: {
        create: [
          {
            organizationId: defaultOrg.id,
          },
        ],
      },
    },
  })

  const reviewer = await prisma.user.upsert({
    where: { username: 'reviewer1' },
    update: {},
    create: {
      username: 'reviewer1',
      realName: '测试审核人',
      passwordHash,
      userType: UserType.TEACHER,
      status: UserStatus.ACTIVE,
      teacherProfile: {
        create: {
          departmentName: '默认部门',
          jobTitle: '讲师',
        },
      },
      userRoles: {
        create: [
          {
            roleId: basicRole.id,
          },
          {
            roleId: reviewerRole.id,
          },
        ],
      },
      userOrganizations: {
        create: [
          {
            organizationId: defaultOrg.id,
          },
        ],
      },
    },
  })

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      realName: '系统管理员',
      passwordHash,
      userType: UserType.TEACHER,
      status: UserStatus.ACTIVE,
      teacherProfile: {
        create: {
          departmentName: '系统管理部',
          jobTitle: '管理员',
        },
      },
      userRoles: {
        create: [
          {
            roleId: basicRole.id,
          },
          {
            roleId: sysAdminRole.id,
          },
        ],
      },
    },
  })

  console.log('Seed completed.')
  console.log('Default password:', password)
  console.log('Seed users:', {
    student: student.username,
    organizer: organizer.username,
    reviewer: reviewer.username,
    admin: admin.username,
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })