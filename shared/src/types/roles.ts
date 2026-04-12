export const UserRole = {
  STUDENT: 'STUDENT',
  ORGANIZER: 'ORGANIZER',
  REVIEWER_L1: 'REVIEWER_L1',
  REVIEWER_L2: 'REVIEWER_L2',
  SYS_ADMIN: 'SYS_ADMIN',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

