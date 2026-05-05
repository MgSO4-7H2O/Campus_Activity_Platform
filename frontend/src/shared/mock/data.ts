/**
 * 原型用 Mock 数据。最终通过真实接口替换；当前仅用于页面演示。
 */

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'approving'
  | 'need_more'
  | 'rejected'
  | 'approved'
  | 'archived'

export type ActivityStatus = 'planned' | 'recruiting' | 'ongoing' | 'finished' | 'closed'
export type RecruitmentStatus = 'draft' | 'published' | 'closed'
export type RegistrationStatus = 'submitted' | 'approved' | 'rejected'

export const APP_STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  approving: '审核中',
  need_more: '待补材料',
  rejected: '已驳回',
  approved: '已通过',
  archived: '已归档',
}

export const APP_STATUS_COLOR: Record<ApplicationStatus, string> = {
  draft: 'default',
  submitted: 'blue',
  approving: 'processing',
  need_more: 'orange',
  rejected: 'red',
  approved: 'green',
  archived: 'gray',
}

export const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  planned: '计划中',
  recruiting: '招募中',
  ongoing: '进行中',
  finished: '已结束',
  closed: '已关闭',
}

export const RECRUIT_STATUS_LABEL: Record<RecruitmentStatus, string> = {
  draft: '未发布',
  published: '招募中',
  closed: '已关闭',
}

export const REGISTRATION_STATUS_LABEL: Record<RegistrationStatus, string> = {
  submitted: '待审核',
  approved: '已通过',
  rejected: '未通过',
}

export type Organization = { id: string; name: string; type: 'department' | 'club' | 'office' }

export const orgs: Organization[] = [
  { id: 'org-cs', name: '计算机科学与技术学院', type: 'department' },
  { id: 'org-ai', name: '人工智能社团', type: 'club' },
  { id: 'org-volunteer', name: '青年志愿者协会', type: 'club' },
  { id: 'org-academic', name: '教务处', type: 'office' },
]

export type ActivityApplication = {
  id: string
  title: string
  organizationId: string
  organizerName: string
  status: ApplicationStatus
  submittedAt: string | null
  updatedAt: string
  expectedStart: string
  expectedEnd: string
  expectedScale: number
  budget: number
  brief: string
  attachments: { name: string; size: string }[]
  reviewHistory: ReviewLog[]
}

export type ReviewLog = {
  level: number
  reviewer: string
  decision: 'approve' | 'reject' | 'need_more'
  comment: string
  at: string
}

export const myApplications: ActivityApplication[] = [
  {
    id: 'app-001',
    title: '2026 春季编程马拉松',
    organizationId: 'org-cs',
    organizerName: '王宇晗',
    status: 'approving',
    submittedAt: '2026-05-02 14:21',
    updatedAt: '2026-05-03 09:10',
    expectedStart: '2026-05-25 09:00',
    expectedEnd: '2026-05-26 18:00',
    expectedScale: 120,
    budget: 8000,
    brief: '面向全校学生的两天编程马拉松，邀请校内外专家担任评委。',
    attachments: [
      { name: '活动方案.pdf', size: '1.2 MB' },
      { name: '安全预案.docx', size: '256 KB' },
    ],
    reviewHistory: [
      { level: 1, reviewer: '李老师', decision: 'approve', comment: '符合学院方向，同意进入二级。', at: '2026-05-02 16:40' },
    ],
  },
  {
    id: 'app-002',
    title: '人工智能前沿讲座',
    organizationId: 'org-ai',
    organizerName: '王宇晗',
    status: 'need_more',
    submittedAt: '2026-04-28 11:00',
    updatedAt: '2026-04-29 13:22',
    expectedStart: '2026-05-18 19:00',
    expectedEnd: '2026-05-18 21:00',
    expectedScale: 80,
    budget: 1500,
    brief: '邀请阿里云高级工程师讲解 AI Agent 工程实践。',
    attachments: [{ name: '讲座海报.png', size: '480 KB' }],
    reviewHistory: [
      { level: 1, reviewer: '陈老师', decision: 'need_more', comment: '请补充嘉宾简历与资金来源说明。', at: '2026-04-29 13:22' },
    ],
  },
  {
    id: 'app-003',
    title: '校园开放日志愿服务',
    organizationId: 'org-volunteer',
    organizerName: '王宇晗',
    status: 'draft',
    submittedAt: null,
    updatedAt: '2026-05-04 21:18',
    expectedStart: '2026-06-08 08:00',
    expectedEnd: '2026-06-08 17:00',
    expectedScale: 40,
    budget: 600,
    brief: '协助开放日导览、咨询接待、物资整理。',
    attachments: [],
    reviewHistory: [],
  },
]

export type ReviewerTodo = {
  applicationId: string
  title: string
  organizerName: string
  organizationName: string
  level: number
  submittedAt: string
  brief: string
}

export const reviewerInbox: ReviewerTodo[] = [
  {
    applicationId: 'app-001',
    title: '2026 春季编程马拉松',
    organizerName: '王宇晗',
    organizationName: '计算机科学与技术学院',
    level: 2,
    submittedAt: '2026-05-02 14:21',
    brief: '面向全校的双日编程马拉松，预计 120 人。',
  },
  {
    applicationId: 'app-101',
    title: '低年级英语角',
    organizerName: '钱小雨',
    organizationName: '外国语学院',
    level: 1,
    submittedAt: '2026-05-04 09:30',
    brief: '面向大一新生的每周英语角，每场 30 人。',
  },
  {
    applicationId: 'app-102',
    title: '红十字应急救护培训',
    organizerName: '李子谦',
    organizationName: '青年志愿者协会',
    level: 1,
    submittedAt: '2026-05-04 17:48',
    brief: '与校医院合作的应急救护培训，理论加实操。',
  },
]

export type Activity = {
  id: string
  title: string
  applicationId: string
  organizationName: string
  organizerName: string
  status: ActivityStatus
  startAt: string
  endAt: string
  location: string
  capacity: number
  registered: number
  brief: string
  cover?: string
}

export const activities: Activity[] = [
  {
    id: 'act-001',
    title: '2026 春季编程马拉松',
    applicationId: 'app-001',
    organizationName: '计算机科学与技术学院',
    organizerName: '王宇晗',
    status: 'recruiting',
    startAt: '2026-05-25 09:00',
    endAt: '2026-05-26 18:00',
    location: '紫金港校区 · 图书馆 B201',
    capacity: 120,
    registered: 86,
    brief: '面向全校学生的两天编程马拉松。',
  },
  {
    id: 'act-002',
    title: '校园歌手大赛决赛',
    applicationId: 'app-077',
    organizationName: '校学生会',
    organizerName: '吴若楠',
    status: 'ongoing',
    startAt: '2026-05-05 19:00',
    endAt: '2026-05-05 22:00',
    location: '紫金港校区 · 大礼堂',
    capacity: 800,
    registered: 800,
    brief: '十强选手现场角逐，邀请校内外评委到场。',
  },
  {
    id: 'act-003',
    title: '红十字应急救护培训',
    applicationId: 'app-102',
    organizationName: '青年志愿者协会',
    organizerName: '李子谦',
    status: 'planned',
    startAt: '2026-05-30 14:00',
    endAt: '2026-05-30 17:00',
    location: '玉泉校区 · 第一教学楼 105',
    capacity: 60,
    registered: 0,
    brief: '与校医院合作的应急救护培训。',
  },
]

export type Recruitment = {
  id: string
  activityId: string
  status: RecruitmentStatus
  registrationStart: string
  registrationEnd: string
  capacity: number
  userTypes: ('STUDENT' | 'TEACHER')[]
  gradeLimit?: string[]
  majorLimit?: string[]
  needMaterial: boolean
  publishedAt?: string
}

export const recruitments: Record<string, Recruitment> = {
  'act-001': {
    id: 'rec-001',
    activityId: 'act-001',
    status: 'published',
    registrationStart: '2026-05-06 00:00',
    registrationEnd: '2026-05-22 23:59',
    capacity: 120,
    userTypes: ['STUDENT'],
    gradeLimit: ['2023', '2024', '2025'],
    majorLimit: ['计算机科学与技术', '软件工程', '人工智能'],
    needMaterial: true,
    publishedAt: '2026-05-04 10:00',
  },
}

export type Registration = {
  id: string
  activityId: string
  userId: string
  realName: string
  userType: 'STUDENT' | 'TEACHER'
  college: string
  major: string
  grade: string
  status: RegistrationStatus
  submittedAt: string
  material?: { name: string; size: string }
  rejectReason?: string
}

export const registrations: Registration[] = [
  {
    id: 'reg-001',
    activityId: 'act-001',
    userId: 'u-1001',
    realName: '王同学',
    userType: 'STUDENT',
    college: '计算机学院',
    major: '软件工程',
    grade: '2024',
    status: 'submitted',
    submittedAt: '2026-05-04 11:24',
    material: { name: '历史项目作品集.zip', size: '6.4 MB' },
  },
  {
    id: 'reg-002',
    activityId: 'act-001',
    userId: 'u-1002',
    realName: '李同学',
    userType: 'STUDENT',
    college: '计算机学院',
    major: '人工智能',
    grade: '2023',
    status: 'approved',
    submittedAt: '2026-05-03 22:10',
  },
  {
    id: 'reg-003',
    activityId: 'act-001',
    userId: 'u-1003',
    realName: '赵同学',
    userType: 'STUDENT',
    college: '机械工程学院',
    major: '机械工程',
    grade: '2024',
    status: 'rejected',
    submittedAt: '2026-05-04 09:11',
    rejectReason: '专业不符合招募要求。',
  },
]

export type CheckinSession = {
  id: string
  activityId: string
  title: string
  method: 'qrcode' | 'code' | 'manual'
  code?: string
  startAt: string
  endAt: string
  signedCount: number
  totalCount: number
}

export const checkinSessions: CheckinSession[] = [
  {
    id: 'sign-001',
    activityId: 'act-001',
    title: 'Day 1 · 上午签到',
    method: 'code',
    code: '538291',
    startAt: '2026-05-25 08:30',
    endAt: '2026-05-25 09:30',
    signedCount: 78,
    totalCount: 120,
  },
  {
    id: 'sign-002',
    activityId: 'act-001',
    title: 'Day 1 · 下午签到',
    method: 'manual',
    startAt: '2026-05-25 13:30',
    endAt: '2026-05-25 14:00',
    signedCount: 0,
    totalCount: 120,
  },
]

export type Closure = {
  id: string
  activityId: string
  activityTitle: string
  applicantName: string
  status: ApplicationStatus
  submittedAt: string
  summary: string
  participants: number
  attachments: { name: string; size: string }[]
  reviewHistory: ReviewLog[]
}

export const closures: Closure[] = [
  {
    id: 'close-001',
    activityId: 'act-002',
    activityTitle: '校园歌手大赛决赛',
    applicantName: '吴若楠',
    status: 'approving',
    submittedAt: '2026-05-04 22:30',
    summary: '比赛顺利完成，现场观众约 760 人，无安全事故。',
    participants: 760,
    attachments: [
      { name: '现场照片.zip', size: '24 MB' },
      { name: '财务结算单.xlsx', size: '88 KB' },
    ],
    reviewHistory: [],
  },
]

export type Announcement = {
  id: string
  title: string
  category: '新闻' | '通知' | '活动'
  publishedAt: string
  author: string
  excerpt: string
  pinned?: boolean
}

export const announcements: Announcement[] = [
  {
    id: 'a-001',
    title: '关于举办 2026 校园文化节的预通知',
    category: '通知',
    publishedAt: '2026-05-04 10:00',
    author: '校团委',
    excerpt: '现就举办 2026 校园文化节相关事宜进行预通知，请各组织于 5 月 12 日前报送活动方案。',
    pinned: true,
  },
  {
    id: 'a-002',
    title: '编程马拉松招募开启，欢迎报名！',
    category: '活动',
    publishedAt: '2026-05-04 12:30',
    author: '计算机学院',
    excerpt: '面向全校学生，限额 120 人，报名截止 5 月 22 日。',
  },
  {
    id: 'a-003',
    title: '校园歌手大赛决赛今晚举行',
    category: '新闻',
    publishedAt: '2026-05-05 09:00',
    author: '校学生会',
    excerpt: '十强选手将在今晚 19:00 在大礼堂进行最终角逐。',
  },
]

export type NotificationItem = {
  id: string
  title: string
  body: string
  type: 'flow' | 'announce' | 'system'
  link?: string
  read: boolean
  createdAt: string
}

export const notifications: NotificationItem[] = [
  {
    id: 'n-001',
    title: '【立项审核】《2026 春季编程马拉松》一级审核通过',
    body: '李老师同意进入二级审核，请关注后续审批进展。',
    type: 'flow',
    link: '/applications/app-001',
    read: false,
    createdAt: '2026-05-02 16:42',
  },
  {
    id: 'n-002',
    title: '【报名审核】3 条新报名待你审核',
    body: '《2026 春季编程马拉松》收到 3 条新报名，请及时处理。',
    type: 'flow',
    link: '/activities/act-001/registrations',
    read: false,
    createdAt: '2026-05-04 11:30',
  },
  {
    id: 'n-003',
    title: '【系统】平台将于本周日凌晨进行例行维护',
    body: '5 月 11 日 02:00–04:00，期间部分功能不可用。',
    type: 'system',
    read: true,
    createdAt: '2026-05-03 18:00',
  },
]

export type RoleApplication = {
  id: string
  appliedRole: string
  organizationName?: string
  reason: string
  status: ApplicationStatus
  submittedAt: string
  reviewer?: string
  decisionAt?: string
}

export const myRoleApplications: RoleApplication[] = [
  {
    id: 'role-001',
    appliedRole: 'ORGANIZER',
    organizationName: '人工智能社团',
    reason: '本人为社团技术部负责人，希望承担活动立项与执行。',
    status: 'approved',
    submittedAt: '2026-04-22 09:30',
    reviewer: '系统管理员',
    decisionAt: '2026-04-22 14:10',
  },
]
