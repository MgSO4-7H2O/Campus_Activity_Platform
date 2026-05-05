import { Tag } from 'antd'

import {
  ACTIVITY_STATUS_LABEL,
  APP_STATUS_COLOR,
  APP_STATUS_LABEL,
  RECRUIT_STATUS_LABEL,
  REGISTRATION_STATUS_LABEL,
  type ActivityStatus,
  type ApplicationStatus,
  type RecruitmentStatus,
  type RegistrationStatus,
} from '../mock/data'

const ACTIVITY_COLOR: Record<ActivityStatus, string> = {
  planned: 'default',
  recruiting: 'blue',
  ongoing: 'processing',
  finished: 'green',
  closed: 'gray',
}

const RECRUIT_COLOR: Record<RecruitmentStatus, string> = {
  draft: 'default',
  published: 'green',
  closed: 'gray',
}

const REGISTRATION_COLOR: Record<RegistrationStatus, string> = {
  submitted: 'blue',
  approved: 'green',
  rejected: 'red',
}

export function ApplicationStatusTag({ status }: { status: ApplicationStatus }) {
  return <Tag color={APP_STATUS_COLOR[status]}>{APP_STATUS_LABEL[status]}</Tag>
}

export function ActivityStatusTag({ status }: { status: ActivityStatus }) {
  return <Tag color={ACTIVITY_COLOR[status]}>{ACTIVITY_STATUS_LABEL[status]}</Tag>
}

export function RecruitmentStatusTag({ status }: { status: RecruitmentStatus }) {
  return <Tag color={RECRUIT_COLOR[status]}>{RECRUIT_STATUS_LABEL[status]}</Tag>
}

export function RegistrationStatusTag({ status }: { status: RegistrationStatus }) {
  return <Tag color={REGISTRATION_COLOR[status]}>{REGISTRATION_STATUS_LABEL[status]}</Tag>
}
