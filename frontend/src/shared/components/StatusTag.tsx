import { Tag } from 'antd'
import type {
  ActivityApplicationStatus,
  ActivityStatus,
  RecruitmentStatus,
  SignupStatus,
} from '../api/dto'

// ---------- Activity Application ----------

const APP_STATUS_LABEL: Record<ActivityApplicationStatus, string> = {
  DRAFT: '草稿',
  SUBMITTED: '已提交',
  APPROVING: '审核中',
  NEED_MORE: '需补材料',
  REJECTED: '已驳回',
  APPROVED: '已通过',
  ARCHIVED: '已归档',
}

const APP_STATUS_COLOR: Record<ActivityApplicationStatus, string> = {
  DRAFT: 'default',
  SUBMITTED: 'blue',
  APPROVING: 'processing',
  NEED_MORE: 'orange',
  REJECTED: 'red',
  APPROVED: 'green',
  ARCHIVED: 'default',
}

export function ApplicationStatusTag({ status }: { status: ActivityApplicationStatus }) {
  return <Tag color={APP_STATUS_COLOR[status]}>{APP_STATUS_LABEL[status]}</Tag>
}

// ---------- Activity ----------

const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  PLANNED: '已立项',
  RECRUITING: '招募中',
  ONGOING: '进行中',
  FINISHED: '已结束',
  CLOSED: '已关闭',
}

const ACTIVITY_COLOR: Record<ActivityStatus, string> = {
  PLANNED: 'default',
  RECRUITING: 'blue',
  ONGOING: 'processing',
  FINISHED: 'green',
  CLOSED: 'default',
}

export function ActivityStatusTag({ status }: { status: ActivityStatus }) {
  return <Tag color={ACTIVITY_COLOR[status]}>{ACTIVITY_STATUS_LABEL[status]}</Tag>
}

// ---------- Recruitment ----------

const RECRUIT_STATUS_LABEL: Record<RecruitmentStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  CLOSED: '已关闭',
}

const RECRUIT_COLOR: Record<RecruitmentStatus, string> = {
  DRAFT: 'default',
  PUBLISHED: 'green',
  CLOSED: 'default',
}

export function RecruitmentStatusTag({ status }: { status: RecruitmentStatus }) {
  return <Tag color={RECRUIT_COLOR[status]}>{RECRUIT_STATUS_LABEL[status]}</Tag>
}

// ---------- Signup / Registration ----------

const REGISTRATION_STATUS_LABEL: Record<SignupStatus, string> = {
  SUBMITTED: '已提交',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  CANCELED: '已取消',
}

const REGISTRATION_COLOR: Record<SignupStatus, string> = {
  SUBMITTED: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELED: 'default',
}

export function RegistrationStatusTag({ status }: { status: SignupStatus }) {
  return <Tag color={REGISTRATION_COLOR[status]}>{REGISTRATION_STATUS_LABEL[status]}</Tag>
}
