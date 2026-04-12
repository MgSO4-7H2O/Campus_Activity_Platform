export const ActivityApplicationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVING: 'APPROVING',
  NEED_MORE: 'NEED_MORE',
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED',
  ARCHIVED: 'ARCHIVED',
} as const

export type ActivityApplicationStatus =
  (typeof ActivityApplicationStatus)[keyof typeof ActivityApplicationStatus]

export const SignupStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELED: 'CANCELED',
} as const

export type SignupStatus = (typeof SignupStatus)[keyof typeof SignupStatus]

