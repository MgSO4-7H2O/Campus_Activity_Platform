/**
 * 🌟 校园活动平台 — 演示数据种子脚本
 *
 * 每次运行会 upsert 账号/组织，并清空业务数据后重新插入。
 * 所有演示账号密码统一为 Password123!
 */
import {
  PrismaClient,
  UserStatus,
  UserType,
  ActivityApplicationStatus,
  ReviewResult,
  ActivityStatus,
  RecruitmentStatus,
  RecruitmentTargetUserType,
  SignupStatus,
  CheckinMode,
  CheckinSessionStatus,
  CheckinRecordStatus,
  PendingTaskType,
  RelatedResourceType,
  PendingTaskStatus,
  AnnouncementType,
  AnnouncementStatus,
  NotificationTargetType,
  NotificationSourceType,
} from '@prisma/client'
import crypto from 'node:crypto'

const prisma = new PrismaClient()

function base64UrlEncode(buf: Buffer) {
  return buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16)
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 32, (err, dk) => {
      if (err) reject(err)
      else resolve(dk as Buffer)
    })
  })
  return `scrypt$${base64UrlEncode(salt)}$${base64UrlEncode(derived)}`
}

async function main() {
  console.log('🌱 开始填充演示数据...\n')

  const password = 'Password123!'
  const passwordHash = await hashPassword(password)

  // ======================== 角色 ========================
  const basicRole = await prisma.role.upsert({
    where: { code: 'BASIC_USER' },
    update: {},
    create: { code: 'BASIC_USER', name: '基础用户', description: '普通学生或教师，可以报名活动、查看公告' },
  })
  const organizerRole = await prisma.role.upsert({
    where: { code: 'ORGANIZER' },
    update: {},
    create: { code: 'ORGANIZER', name: '活动负责人', description: '发起活动立项、发布招募、审核报名和提交结项' },
  })
  const reviewerRole = await prisma.role.upsert({
    where: { code: 'REVIEWER' },
    update: {},
    create: { code: 'REVIEWER', name: '审核人', description: '审核活动立项和结项申请' },
  })
  const sysAdminRole = await prisma.role.upsert({
    where: { code: 'SYS_ADMIN' },
    update: {},
    create: { code: 'SYS_ADMIN', name: '系统管理员', description: '系统管理和权限申请审核' },
  })

  // ======================== 组织 ========================
  const rootOrg = await prisma.organization.upsert({
    where: { orgCode: 'ROOT_ORG' },
    update: {},
    create: { orgCode: 'ROOT_ORG', name: '校党委宣传部', type: 'ADMINISTRATION', status: 'ACTIVE', description: '校级审核组织' },
  })
  const committeeOrg = await prisma.organization.upsert({
    where: { orgCode: 'COMM_ORG' },
    update: {},
    create: { orgCode: 'COMM_ORG', name: '校团委', type: 'ADMINISTRATION', status: 'ACTIVE', parentOrgId: rootOrg.id, description: '校团委' },
  })
  const studentAffairsOrg = await prisma.organization.upsert({
    where: { orgCode: 'STU_AFF' },
    update: {},
    create: { orgCode: 'STU_AFF', name: '学工部', type: 'ADMINISTRATION', status: 'ACTIVE', parentOrgId: rootOrg.id, description: '学工部' },
  })
  const clubCenterOrg = await prisma.organization.upsert({
    where: { orgCode: 'CLUB_CENTER' },
    update: {},
    create: { orgCode: 'CLUB_CENTER', name: '社团指导中心', type: 'ADMINISTRATION', status: 'ACTIVE', parentOrgId: rootOrg.id, description: '社团指导中心' },
  })
  const csDeptOrg = await prisma.organization.upsert({
    where: { orgCode: 'CS_DEPT' },
    update: {},
    create: { orgCode: 'CS_DEPT', name: '计算机科学与技术学院团委', type: 'ADMINISTRATION', status: 'ACTIVE', parentOrgId: committeeOrg.id, description: '计算机学院团委' },
  })
  const aiClubOrg = await prisma.organization.upsert({
    where: { orgCode: 'AI_CLUB' },
    update: {},
    create: { orgCode: 'AI_CLUB', name: '人工智能社团', type: 'CLUB', status: 'ACTIVE', parentOrgId: clubCenterOrg.id, description: '人工智能社团' },
  })
  const musicClubOrg = await prisma.organization.upsert({
    where: { orgCode: 'MUSIC_CLUB' },
    update: {},
    create: { orgCode: 'MUSIC_CLUB', name: '音乐协会', type: 'CLUB', status: 'ACTIVE', parentOrgId: clubCenterOrg.id, description: '校园音乐艺术社团' },
  })
  const volunteerOrg = await prisma.organization.upsert({
    where: { orgCode: 'VOLUNTEER' },
    update: {},
    create: { orgCode: 'VOLUNTEER', name: '青年志愿者协会', type: 'STUDENT_ORGANIZATION', status: 'ACTIVE', parentOrgId: studentAffairsOrg.id, description: '校园志愿服务组织' },
  })

  // ======================== 用户 ========================
  const student = await prisma.user.upsert({
    where: { username: 'student1' },
    update: {},
    create: {
      username: 'student1', realName: '张同学', passwordHash, userType: UserType.STUDENT, status: UserStatus.ACTIVE,
      studentProfile: { create: { college: '计算机科学与技术学院', major: '计算机科学与技术', grade: 2024, className: '计科2401班' } },
      userRoles: { create: [{ roleId: basicRole.id }] },
    },
  })

  const organizer = await prisma.user.upsert({
    where: { username: 'organizer1' },
    update: {},
    create: {
      username: 'organizer1', realName: '李负责人', passwordHash, userType: UserType.STUDENT, status: UserStatus.ACTIVE,
      studentProfile: { create: { college: '计算机科学与技术学院', major: '人工智能', grade: 2023, className: '人工智能2301班' } },
      userRoles: { create: [{ roleId: basicRole.id }, { roleId: organizerRole.id }] },
      userOrganizations: { create: [{ organizationId: aiClubOrg.id }] },
    },
  })

  const reviewer = await prisma.user.upsert({
    where: { username: 'reviewer1' },
    update: {},
    create: {
      username: 'reviewer1', realName: '王审核员', passwordHash, userType: UserType.TEACHER, status: UserStatus.ACTIVE,
      teacherProfile: { create: { departmentName: '计算机科学与技术学院', jobTitle: '副教授' } },
      userRoles: { create: [{ roleId: basicRole.id }, { roleId: reviewerRole.id }] },
      userOrganizations: {
        create: [
          { organizationId: csDeptOrg.id },
          { organizationId: clubCenterOrg.id },
          { organizationId: rootOrg.id },
        ],
      },
    },
  })

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin', realName: '系统管理员', passwordHash, userType: UserType.TEACHER, status: UserStatus.ACTIVE,
      teacherProfile: { create: { departmentName: '信息化中心', jobTitle: '系统管理员' } },
      userRoles: { create: [{ roleId: basicRole.id }, { roleId: sysAdminRole.id }] },
    },
  })

  // ======================== 清空旧业务数据 ========================
  console.log('  清理旧业务数据...')
  // 重新设置 reviewer 的组织关联（覆盖旧的）
  await prisma.userOrganization.deleteMany({ where: { userId: reviewer.id } })
  await prisma.userOrganization.createMany({
    data: [
      { userId: reviewer.id, organizationId: csDeptOrg.id },
      { userId: reviewer.id, organizationId: clubCenterOrg.id },
      { userId: reviewer.id, organizationId: rootOrg.id },
    ],
  })
  // 确保 organizer 的组织关联
  await prisma.userOrganization.deleteMany({ where: { userId: organizer.id } })
  await prisma.userOrganization.createMany({
    data: [
      { userId: organizer.id, organizationId: aiClubOrg.id },
      { userId: organizer.id, organizationId: musicClubOrg.id },
      { userId: organizer.id, organizationId: volunteerOrg.id },
    ],
  })
  await prisma.notificationReceipt.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.systemLog.deleteMany()
  await prisma.pendingTask.deleteMany()
  await prisma.closureReviewRecord.deleteMany()
  await prisma.closureAttachment.deleteMany()
  await prisma.closureApplication.deleteMany()
  await prisma.checkinRecord.deleteMany()
  await prisma.checkinSession.deleteMany()
  await prisma.signupAttachment.deleteMany()
  await prisma.recruitmentSignup.deleteMany()
  await prisma.recruitmentAllowedMajor.deleteMany()
  await prisma.recruitment.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.approvalRecord.deleteMany()
  await prisma.applicationAttachment.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.activityApplication.deleteMany()
  await prisma.roleApplication.deleteMany()

  // ======================== 活动立项申请 + 活动 ========================
  console.log('  创建活动立项申请和正式活动...')

  const now = new Date()
  const d = (daysOffset: number) => new Date(now.getTime() + daysOffset * 86400000)

  // --- 申请1：已通过 → 正式活动（招募中）---
  const app1 = await prisma.activityApplication.create({
    data: {
      applicantId: organizer.id, organizationId: aiClubOrg.id,
      title: '2026 AI 创新挑战赛',
      summary: '面向全校的 AI 创新实践活动，包括算法竞赛、项目路演和技术分享三大板块。鼓励跨学科组队，优胜团队将获得企业赞助奖金。',
      location: '紫金港校区 · 蒙民伟楼 225 报告厅',
      startTime: d(14), endTime: d(14),
      status: 'APPROVED', submittedAt: d(-14), currentLevel: 2,
    },
  })
  const activity1 = await prisma.activity.create({
    data: {
      applicationId: app1.id, title: app1.title, organizerId: organizer.id, organizationId: aiClubOrg.id,
      startTime: app1.startTime, endTime: app1.endTime, status: 'RECRUITING', publishedAt: d(-7),
    },
  })

  // --- 申请2：已通过 → 正式活动（进行中）---
  const app2 = await prisma.activityApplication.create({
    data: {
      applicantId: organizer.id, organizationId: aiClubOrg.id,
      title: '春季编程马拉松',
      summary: '48小时极限编程挑战，5人一组完成一个完整项目。主题涵盖 Web 应用、移动端、AI 应用，现场有导师指导。',
      location: '紫金港校区 · 图书馆 B201 研讨室',
      startTime: d(-3), endTime: d(4),
      status: 'APPROVED', submittedAt: d(-21), currentLevel: 2,
    },
  })
  const activity2 = await prisma.activity.create({
    data: {
      applicationId: app2.id, title: app2.title, organizerId: organizer.id, organizationId: aiClubOrg.id,
      startTime: app2.startTime, endTime: app2.endTime, status: 'ONGOING', publishedAt: d(-10),
    },
  })

  // --- 申请3：已通过（刚通过，计划中）---
  const app3 = await prisma.activityApplication.create({
    data: {
      applicantId: organizer.id, organizationId: musicClubOrg.id,
      title: '校园歌手大赛决赛',
      summary: '经过初赛和复赛选拔，12 位选手角逐年度校园十佳歌手称号。现场有专业评委和观众投票环节。',
      location: '紫金港校区 · 小剧场',
      startTime: d(21), endTime: d(21),
      status: 'APPROVED', submittedAt: d(-5), currentLevel: 1,
    },
  })
  const activity3 = await prisma.activity.create({
    data: {
      applicationId: app3.id, title: app3.title, organizerId: organizer.id, organizationId: musicClubOrg.id,
      startTime: app3.startTime, endTime: app3.endTime, status: 'PLANNED', publishedAt: d(-3),
    },
  })

  // --- 申请4：审核中 ---
  const app4 = await prisma.activityApplication.create({
    data: {
      applicantId: organizer.id, organizationId: aiClubOrg.id,
      title: '机器学习 Workshop 系列',
      summary: '为期四周的机器学习入门工作坊，每周一个主题：监督学习、无监督学习、深度学习基础、项目实战。面向零基础同学。',
      location: '紫金港校区 · 曹光彪楼 201',
      startTime: d(30), endTime: d(58),
      status: 'APPROVING', submittedAt: d(-2), currentLevel: 1, currentReviewerId: reviewer.id,
    },
  })

  // --- 申请5：已提交待审核 ---
  const app5 = await prisma.activityApplication.create({
    data: {
      applicantId: organizer.id, organizationId: volunteerOrg.id,
      title: '红十字应急救护培训',
      summary: '联合校医院开展应急救护技能培训，包括 CPR 心肺复苏、AED 使用、创伤包扎等实用急救技能。考核通过颁发证书。',
      location: '紫金港校区 · 医学院实训中心',
      startTime: d(10), endTime: d(10),
      status: 'SUBMITTED', submittedAt: d(-1), currentLevel: 1, currentReviewerId: reviewer.id,
    },
  })

  // --- 申请6：被驳回 ---
  const app6 = await prisma.activityApplication.create({
    data: {
      applicantId: organizer.id, organizationId: aiClubOrg.id,
      title: '深夜电竞联赛',
      summary: '计划在宿舍区举办为期一周的深夜电竞比赛，每日赛程从晚 10 点到凌晨 2 点。',
      location: '学生宿舍区活动室',
      startTime: d(7), endTime: d(14),
      status: 'REJECTED', submittedAt: d(-10),
    },
  })

  // --- 申请7：已通过 → 正式活动（已结束）---
  const app7 = await prisma.activityApplication.create({
    data: {
      applicantId: organizer.id, organizationId: volunteerOrg.id,
      title: '校园环保周',
      summary: '为期一周的环保主题活动：垃圾分类宣传、旧物回收义卖、低碳出行打卡、校园绿植种植。倡导绿色校园理念。',
      location: '全校各区域',
      startTime: d(-30), endTime: d(-24),
      status: 'APPROVED', submittedAt: d(-40), currentLevel: 2,
    },
  })
  const activity7 = await prisma.activity.create({
    data: {
      applicationId: app7.id, title: app7.title, organizerId: organizer.id, organizationId: volunteerOrg.id,
      startTime: app7.startTime, endTime: app7.endTime, status: 'FINISHED', publishedAt: d(-35),
    },
  })

  // --- 申请8：草稿 ---
  const app8 = await prisma.activityApplication.create({
    data: {
      applicantId: organizer.id, organizationId: aiClubOrg.id,
      title: '秋季迎新 Hackathon',
      summary: '面向新生的编程入门活动',
      location: '待定',
      startTime: d(60), endTime: d(61),
      status: 'DRAFT',
    },
  })

  // ======================== 审核记录 ========================
  console.log('  创建审核记录...')
  // 申请1 的两级审核
  await prisma.approvalRecord.createMany({
    data: [
      { activityApplicationId: app1.id, reviewerId: reviewer.id, level: 1, reviewerOrganizationId: csDeptOrg.id, result: 'APPROVED', comment: '方案完整，预算合理，同意立项', reviewedAt: d(-10) },
      { activityApplicationId: app1.id, reviewerId: admin.id, level: 2, reviewerOrganizationId: rootOrg.id, result: 'APPROVED', comment: '批准通过', reviewedAt: d(-8) },
      { activityApplicationId: app2.id, reviewerId: reviewer.id, level: 1, reviewerOrganizationId: csDeptOrg.id, result: 'APPROVED', comment: '编程马拉松很有意义，建议加强安全管理', reviewedAt: d(-18) },
      { activityApplicationId: app2.id, reviewerId: admin.id, level: 2, reviewerOrganizationId: rootOrg.id, result: 'APPROVED', comment: '同意', reviewedAt: d(-16) },
      { activityApplicationId: app3.id, reviewerId: reviewer.id, level: 1, reviewerOrganizationId: csDeptOrg.id, result: 'APPROVED', comment: '校园文化活动，支持', reviewedAt: d(-4) },
      { activityApplicationId: app6.id, reviewerId: reviewer.id, level: 1, reviewerOrganizationId: csDeptOrg.id, result: 'REJECTED', comment: '深夜活动不符合宿舍管理规定，建议调整时间重新申请', reviewedAt: d(-8) },
      { activityApplicationId: app7.id, reviewerId: reviewer.id, level: 1, reviewerOrganizationId: csDeptOrg.id, result: 'APPROVED', comment: '环保主题很有意义', reviewedAt: d(-38) },
      { activityApplicationId: app7.id, reviewerId: admin.id, level: 2, reviewerOrganizationId: rootOrg.id, result: 'APPROVED', comment: '同意举办', reviewedAt: d(-36) },
    ],
  })

  // ======================== 招募 ========================
  console.log('  创建招募信息...')
  const rec1 = await prisma.recruitment.create({
    data: {
      activityId: activity1.id, title: 'AI 创新挑战赛选手招募',
      quota: 200, description: '欢迎全校同学报名参赛！三人一组，自由组队。',
      signupStartTime: d(-7), signupEndTime: d(10),
      targetUserType: 'ALL', status: 'PUBLISHED', requiresAttachment: false,
    },
  })
  const rec2 = await prisma.recruitment.create({
    data: {
      activityId: activity2.id, title: '编程马拉松选手招募',
      quota: 100, description: '5人一组，48小时极限编程。建议有编程基础的同学报名。',
      signupStartTime: d(-10), signupEndTime: d(-1),
      targetUserType: 'STUDENT', status: 'PUBLISHED', requiresAttachment: false,
      minGrade: 2022, maxGrade: 2025,
    },
  })
  const rec3 = await prisma.recruitment.create({
    data: {
      activityId: activity3.id, title: '歌手大赛志愿者招募',
      quota: 30, description: '招募活动现场工作人员，包括场务、引导、计票等岗位。',
      signupStartTime: d(-3), signupEndTime: d(18),
      targetUserType: 'ALL', status: 'PUBLISHED', requiresAttachment: true,
    },
  })

  // ======================== 报名记录 ========================
  console.log('  创建报名记录...')
  await prisma.recruitmentSignup.createMany({
    data: [
      { recruitmentId: rec1.id, userId: student.id, status: 'APPROVED', appliedAt: d(-5), reviewedAt: d(-3), reviewedBy: organizer.id },
      { recruitmentId: rec2.id, userId: student.id, status: 'PENDING', appliedAt: d(-3) },
    ],
  })

  // ======================== 签到场次 ========================
  console.log('  创建签到场次...')
  const checkin1 = await prisma.checkinSession.create({
    data: {
      activityId: activity2.id, mode: 'CODE', checkinCode: 'HACK2026',
      startTime: d(-3), endTime: d(5), status: 'OPEN', createdBy: organizer.id,
    },
  })
  await prisma.checkinRecord.create({
    data: {
      sessionId: checkin1.id, activityId: activity2.id, userId: organizer.id,
      status: 'CHECKED_IN', checkedInAt: d(-3),
    },
  })
  // AI 创新挑战赛也创建签到场次
  await prisma.checkinSession.create({
    data: {
      activityId: activity1.id, mode: 'CODE', checkinCode: 'AI2026',
      startTime: d(-2), endTime: d(10), status: 'OPEN', createdBy: organizer.id,
    },
  })

  // ======================== 待办事项 ========================
  console.log('  创建待办事项...')
  await prisma.pendingTask.createMany({
    data: [
      {
        assigneeId: reviewer.id, taskType: 'APPLICATION_REVIEW', relatedResourceType: 'ACTIVITY_APPLICATION',
        relatedResourceId: app4.id, title: `立项审核：${app4.title}`, status: 'PENDING', createdBy: organizer.id,
      },
      {
        assigneeId: reviewer.id, taskType: 'APPLICATION_REVIEW', relatedResourceType: 'ACTIVITY_APPLICATION',
        relatedResourceId: app5.id, title: `立项审核：${app5.title}`, status: 'PENDING', createdBy: organizer.id,
      },
    ],
  })

  // ======================== 公告 ========================
  console.log('  创建公告...')
  await prisma.announcement.createMany({
    data: [
      {
        title: '关于规范校园活动审批流程的通知',
        content: '为进一步规范校园活动的组织和管理，所有活动须提前两周通过本平台提交立项申请，经审核通过后方可开展。详情请查阅平台操作指南。',
        type: 'NOTICE', isPinned: true, publisherId: admin.id, status: 'PUBLISHED', publishedAt: d(-20),
      },
      {
        title: '2026 春季学期活动日历发布',
        content: '春季学期重点活动安排：4月编程马拉松、5月校园歌手大赛、6月毕业季系列活动。各组织负责人请提前规划并提交活动申请。',
        type: 'NEWS', isPinned: false, publisherId: admin.id, status: 'PUBLISHED', publishedAt: d(-15),
      },
      {
        title: 'AI 创新挑战赛即将开始报名',
        content: '由人工智能社团主办的"2026 AI 创新挑战赛"将于 7 月初举行，欢迎全校同学组队参赛。报名通道即将开放，敬请关注。',
        type: 'RECRUITMENT_NOTICE', isPinned: false, publisherId: organizer.id, status: 'PUBLISHED',
        publishedAt: d(-5), activityId: activity1.id,
      },
      {
        title: '编程马拉松活动调整通知',
        content: '因场地原因，原定 6 月 22 日的编程马拉松调整为 6 月 19 日-23 日，地点不变。已报名的同学无需重新报名。',
        type: 'NOTICE', isPinned: false, publisherId: organizer.id, status: 'PUBLISHED',
        publishedAt: d(-2), activityId: activity2.id,
      },
    ],
  })

  // ======================== 通知 ========================
  console.log('  创建通知...')
  const notif1 = await prisma.notification.create({
    data: {
      title: '您的活动立项申请已通过',
      content: `"${app1.title}"的立项申请已经通过所有审核，现已转为正式活动。您可以前往活动管理页面进行招募发布和后续管理。`,
      targetType: 'USER', targetValue: organizer.id, sourceType: 'ACTIVITY_APPLICATION', sourceId: app1.id, createdBy: admin.id,
    },
  })
  const notif2 = await prisma.notification.create({
    data: {
      title: '您的活动立项申请被驳回',
      content: `"${app6.title}"的立项申请已被驳回。驳回原因：深夜活动不符合宿舍管理规定，建议调整时间重新申请。`,
      targetType: 'USER', targetValue: organizer.id, sourceType: 'ACTIVITY_APPLICATION', sourceId: app6.id, createdBy: reviewer.id,
    },
  })
  const notif3 = await prisma.notification.create({
    data: {
      title: '报名审核已通过',
      content: `您在"${activity1.title}"的报名申请已通过审核，请按时参加活动。`,
      targetType: 'USER', targetValue: student.id, sourceType: 'RECRUITMENT_SIGNUP', sourceId: rec1.id, createdBy: organizer.id,
    },
  })

  // 通知接收（已读/未读）
  await prisma.notificationReceipt.createMany({
    data: [
      { notificationId: notif1.id, userId: organizer.id, isRead: true, readAt: d(-6) },
      { notificationId: notif2.id, userId: organizer.id, isRead: false },
      { notificationId: notif3.id, userId: student.id, isRead: false },
    ],
  })

  // ======================== 输出摘要 ========================
  console.log('')
  console.log('✅ 演示数据填充完成！')
  console.log('')
  console.log('┌─────────────┬──────────────────────────────────┐')
  console.log('│  账号       │  说明                            │')
  console.log('├─────────────┼──────────────────────────────────┤')
  console.log('│  student1   │  学生 — 张同学（计算机 2024 级） │')
  console.log('│  organizer1 │  活动负责人 — 李负责人（AI 社团） │')
  console.log('│  reviewer1  │  审核人 — 王审核员（计算机学院）  │')
  console.log('│  admin      │  系统管理员 — 信息化中心         │')
  console.log('└─────────────┴──────────────────────────────────┘')
  console.log(`  默认密码：${password}`)
  console.log('')
  console.log('┌──────────────────────────────────┬──────────┐')
  console.log('│  活动                            │  状态    │')
  console.log('├──────────────────────────────────┼──────────┤')
  console.log(`│  2026 AI 创新挑战赛              │  招募中  │`)
  console.log(`│  春季编程马拉松                  │  进行中  │`)
  console.log(`│  校园歌手大赛决赛                │  已立项  │`)
  console.log(`│  机器学习 Workshop 系列          │  审核中  │`)
  console.log(`│  红十字应急救护培训              │  待审核  │`)
  console.log(`│  深夜电竞联赛                    │  已驳回  │`)
  console.log(`│  校园环保周                      │  已结束  │`)
  console.log(`│  秋季迎新 Hackathon             │  草稿    │`)
  console.log('└──────────────────────────────────┴──────────┘')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (error) => {
    console.error('❌ 种子数据填充失败:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
