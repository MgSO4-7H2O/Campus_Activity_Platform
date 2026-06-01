export const UserRole = {
  BASIC_USER: 'BASIC_USER',
  ORGANIZER: 'ORGANIZER',
  REVIEWER: 'REVIEWER',
  SYS_ADMIN: 'SYS_ADMIN',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]
