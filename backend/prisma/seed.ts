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

  const rootOrg = await prisma.organization.upsert({
    where: { orgCode: 'ROOT_ORG' },
    update: {},
    create: {
      orgCode: 'ROOT_ORG',
      name: '校党委宣传部',
      type: 'ADMINISTRATION',
      status: 'ACTIVE',
      description: '校级审核组织',
    },
  })

  const committeeOrg = await prisma.organization.upsert({
    where: { orgCode: 'COMM_ORG' },
    update: {},
    create: {
      orgCode: 'COMM_ORG',
      name: '校团委',
      type: 'ADMINISTRATION',
      status: 'ACTIVE',
      parentOrgId: rootOrg.id,
      description: '校团委',
    },
  })

  const studentAffairsOrg = await prisma.organization.upsert({
    where: { orgCode: 'STU_AFF' },
    update: {},
    create: {
      orgCode: 'STU_AFF',
      name: '学工部',
      type: 'ADMINISTRATION',
      status: 'ACTIVE',
      parentOrgId: rootOrg.id,
      description: '学工部',
    },
  })

  const clubCenterOrg = await prisma.organization.upsert({
    where: { orgCode: 'CLUB_CENTER' },
    update: {},
    create: {
      orgCode: 'CLUB_CENTER',
      name: '社团指导中心',
      type: 'ADMINISTRATION',
      status: 'ACTIVE',
      parentOrgId: rootOrg.id,
      description: '社团指导中心',
    },
  })

  const csDeptOrg = await prisma.organization.upsert({
    where: { orgCode: 'CS_DEPT' },
    update: {},
    create: {
      orgCode: 'CS_DEPT',
      name: '计算机科学与技术学院团委',
      type: 'ADMINISTRATION',
      status: 'ACTIVE',
      parentOrgId: committeeOrg.id,
      description: '计算机学院团委',
    },
  })

  const aiClubOrg = await prisma.organization.upsert({
    where: { orgCode: 'AI_CLUB' },
    update: {},
    create: {
      orgCode: 'AI_CLUB',
      name: '人工智能社团',
      type: 'CLUB',
      status: 'ACTIVE',
      parentOrgId: clubCenterOrg.id,
      description: '人工智能社团',
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
        create: [{ organizationId: aiClubOrg.id }],
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
        create: [{ organizationId: csDeptOrg.id }],
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

  const seededApplication = await prisma.activityApplication.create({
    data: {
      applicantId: organizer.id,
      organizationId: aiClubOrg.id,
      title: '校园编程马拉松',
      summary: '面向全校的编程实践活动',
      location: '第一报告厅',
      startTime: new Date('2026-06-01T08:00:00.000Z'),
      endTime: new Date('2026-06-01T12:00:00.000Z'),
      status: 'APPROVED',
      submittedAt: new Date(),
      currentLevel: 2,
    },
  })

  await prisma.activity.create({
    data: {
      applicationId: seededApplication.id,
      title: seededApplication.title,
      organizerId: organizer.id,
      organizationId: aiClubOrg.id,
      startTime: seededApplication.startTime,
      endTime: seededApplication.endTime,
      status: 'PLANNED',
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