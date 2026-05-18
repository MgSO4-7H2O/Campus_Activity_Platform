/**
 * 前后端共享的 DTO（接口数据契约）。
 *
 * 命名约定：
 * - 字段使用 camelCase；后端 Prisma schema 也建议保持一致。
 * - 枚举字段使用大写下划线（如 SUBMITTED / APPROVED）。
 * - 时间字段统一使用 ISO 8601 字符串（如 "2026-05-18T08:30:00.000Z"）。
 *
 * 该文件是前后端联调的"单一事实来源"，后端在实现接口时请保持字段一致。
 * 若需要调整，请同步修改 docs/api-contract.md。
 */

// ============== 通用 ==============

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type ListQuery = {
  page?: number
  pageSize?: number
  keyword?: string
}

// ============== 1. 权限申请与审批 ==============

export type RoleAppliedRole = 'ORGANIZER' | 'REVIEWER' | 'SYS_ADMIN'

export type RoleApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVING'
  | 'APPROVED'
  | 'REJECTED'

export type RoleApplicationDto = {
  id: string
  applicantId: string
  applicantName: string | null
  appliedRole: RoleAppliedRole
  organizationId: string | null
  organizationName: string | null
  reason: string
  status: RoleApplicationStatus
  reviewerId: string | null
  reviewerName: string | null
  reviewComment: string | null
  submittedAt: string | null
  decisionAt: string | null
  createdAt: string
  updatedAt: string
}

export type CreateRoleApplicationBody = {
  appliedRole: RoleAppliedRole
  organizationId?: string
  reason: string
}

export type ReviewRoleApplicationBody = {
  decision: 'APPROVE' | 'REJECT'
  comment?: string
}

// ============== 2. 组织管理 ==============

export type OrganizationType =
  | 'club'
  | 'student_organization'
  | 'administration'
  | 'department'

export type OrganizationDto = {
  id: string
  name: string
  type: OrganizationType
  parentOrgId: string | null
  status: 'ACTIVE' | 'DISABLED'
  description: string | null
  createdAt: string
  updatedAt: string
}

export type OrganizationNode = OrganizationDto & {
  children: OrganizationNode[]
}

export type CreateOrganizationBody = {
  name: string
  type: OrganizationType
  parentOrgId?: string
  description?: string
}

export type UpdateOrganizationBody = Partial<CreateOrganizationBody> & {
  status?: 'ACTIVE' | 'DISABLED'
}

export type UserOrganizationDto = {
  userId: string
  organizationId: string
  organizationName: string
  role: 'ORGANIZER' | 'REVIEWER' | 'MEMBER'
  createdAt: string
}

// ============== 3. 待办事项 ==============

export type PendingTaskStatus = 'PENDING' | 'PROCESSED' | 'CANCELLED'

export type PendingTaskResourceType =
  | 'ROLE_APPLICATION'
  | 'ACTIVITY_APPLICATION'
  | 'CLOSURE_APPLICATION'
  | 'RECRUITMENT_SIGNUP'

export type PendingTaskDto = {
  id: string
  ownerId: string
  title: string
  description: string | null
  status: PendingTaskStatus
  relatedResourceType: PendingTaskResourceType
  relatedResourceId: string
  link: string | null
  createdAt: string
  processedAt: string | null
}

// ============== 4. 活动立项申请 ==============

export type ActivityApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVING'
  | 'NEED_MORE'
  | 'REJECTED'
  | 'APPROVED'
  | 'ARCHIVED'

export type ApplicationAttachmentDto = {
  id: string
  applicationId: string
  fileName: string
  fileSize: number
  fileUrl: string
  mimeType: string | null
  uploadedAt: string
}

export type ActivityApplicationDto = {
  id: string
  title: string
  organizationId: string
  organizationName: string
  organizerId: string
  organizerName: string | null
  status: ActivityApplicationStatus
  brief: string
  expectedStart: string
  expectedEnd: string
  expectedScale: number
  budget: number
  location: string | null
  submittedAt: string | null
  currentApprovalLevel: number
  attachments: ApplicationAttachmentDto[]
  createdAt: string
  updatedAt: string
}

export type UpsertActivityApplicationBody = {
  title: string
  organizationId: string
  brief: string
  expectedStart: string
  expectedEnd: string
  expectedScale: number
  budget: number
  location?: string
}

// ============== 5. 立项审核 ==============

export type ApprovalDecision = 'APPROVE' | 'REJECT' | 'NEED_MORE'

export type ApprovalRecordDto = {
  id: string
  applicationId: string
  level: number
  reviewerId: string
  reviewerName: string | null
  organizationId: string | null
  decision: ApprovalDecision
  comment: string | null
  decidedAt: string
}

export type ReviewActivityApplicationBody = {
  decision: ApprovalDecision
  comment?: string
}

// ============== 6. 活动列表 ==============

export type ActivityStatus =
  | 'PLANNED'
  | 'RECRUITING'
  | 'ONGOING'
  | 'FINISHED'
  | 'CLOSED'

export type ActivityDto = {
  id: string
  title: string
  applicationId: string
  organizationId: string
  organizationName: string
  organizerId: string
  organizerName: string | null
  status: ActivityStatus
  startAt: string
  endAt: string
  location: string | null
  capacity: number
  registeredCount: number
  brief: string
  cover: string | null
  createdAt: string
  updatedAt: string
}

// ============== 7. 活动招募 ==============

export type RecruitmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'
export type RecruitmentUserType = 'STUDENT' | 'TEACHER'

export type RecruitmentDto = {
  id: string
  activityId: string
  title: string
  status: RecruitmentStatus
  capacity: number
  registrationStart: string
  registrationEnd: string
  allowedUserTypes: RecruitmentUserType[]
  allowedGrades: string[]
  allowedMajors: string[]
  requiresAttachment: boolean
  publishedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export type UpsertRecruitmentBody = {
  activityId: string
  title: string
  capacity: number
  registrationStart: string
  registrationEnd: string
  allowedUserTypes: RecruitmentUserType[]
  allowedGrades?: string[]
  allowedMajors?: string[]
  requiresAttachment: boolean
}

// ============== 8. 报名 ==============

export type SignupStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELED'

export type SignupAttachmentDto = {
  id: string
  signupId: string
  fileName: string
  fileSize: number
  fileUrl: string
  uploadedAt: string
}

export type SignupDto = {
  id: string
  recruitmentId: string
  activityId: string
  userId: string
  realName: string | null
  userType: RecruitmentUserType
  college: string | null
  major: string | null
  grade: string | null
  status: SignupStatus
  submittedAt: string
  decisionComment: string | null
  decidedAt: string | null
  attachments: SignupAttachmentDto[]
}

export type ReviewSignupBody = {
  decision: 'APPROVE' | 'REJECT'
  comment?: string
}

// ============== 9. 签到 ==============

export type CheckinMethod = 'CODE' | 'QRCODE' | 'MANUAL'
export type CheckinSessionStatus = 'DRAFT' | 'OPEN' | 'CLOSED'
export type CheckinRecordStatus = 'CHECKED_IN' | 'LATE'

export type CheckinSessionDto = {
  id: string
  activityId: string
  title: string
  method: CheckinMethod
  code: string | null
  startAt: string
  endAt: string
  status: CheckinSessionStatus
  signedCount: number
  totalCount: number
  createdAt: string
}

export type CheckinRecordDto = {
  id: string
  sessionId: string
  userId: string
  realName: string | null
  status: CheckinRecordStatus
  checkedInAt: string
  method: CheckinMethod
}

export type CreateCheckinSessionBody = {
  activityId: string
  title: string
  method: CheckinMethod
  startAt: string
  endAt: string
}

// ============== 10. 结项 ==============

export type ClosureStatus = ActivityApplicationStatus

export type ClosureApplicationDto = {
  id: string
  activityId: string
  activityTitle: string
  applicantId: string
  applicantName: string | null
  status: ClosureStatus
  summary: string
  participants: number
  submittedAt: string | null
  currentApprovalLevel: number
  attachments: ApplicationAttachmentDto[]
  createdAt: string
  updatedAt: string
}

export type UpsertClosureApplicationBody = {
  activityId: string
  summary: string
  participants: number
}

// ============== 11. 公告 ==============

export type AnnouncementCategory = 'NEWS' | 'NOTICE' | 'RECRUITMENT' | 'SYSTEM'
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type AnnouncementDto = {
  id: string
  title: string
  category: AnnouncementCategory
  status: AnnouncementStatus
  content: string
  authorId: string
  authorName: string | null
  relatedActivityId: string | null
  pinned: boolean
  publishedAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type UpsertAnnouncementBody = {
  title: string
  category: AnnouncementCategory
  content: string
  pinned?: boolean
  relatedActivityId?: string
}

// ============== 12. 通知 ==============

export type NotificationType = 'FLOW' | 'ANNOUNCE' | 'SYSTEM'

export type NotificationDto = {
  id: string
  recipientId: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
  readAt: string | null
}

// ============== 13. 管理后台 ==============

export type AdminUserDto = {
  id: string
  username: string
  realName: string | null
  email: string | null
  phone: string | null
  userType: 'STUDENT' | 'TEACHER'
  status: 'ACTIVE' | 'DISABLED'
  roles: string[]
  organizations: { id: string; name: string }[]
  createdAt: string
  updatedAt: string
}

export type SystemLogAction =
  | 'AUTH_LOGIN'
  | 'AUTH_REGISTER'
  | 'ROLE_APPLICATION_SUBMIT'
  | 'ROLE_APPLICATION_REVIEW'
  | 'ACTIVITY_APPLICATION_SUBMIT'
  | 'ACTIVITY_APPLICATION_REVIEW'
  | 'SIGNUP_REVIEW'
  | 'CHECKIN_OPEN'
  | 'CLOSURE_REVIEW'
  | 'ANNOUNCEMENT_PUBLISH'

export type SystemLogDto = {
  id: string
  actorId: string | null
  actorName: string | null
  action: SystemLogAction
  resourceType: string | null
  resourceId: string | null
  ip: string | null
  userAgent: string | null
  detail: Record<string, unknown> | null
  createdAt: string
}

export type DashboardSummaryDto = {
  userCount: number
  activeActivityCount: number
  pendingApprovalCount: number
  pendingRoleApplicationCount: number
  recentLogs: SystemLogDto[]
}
