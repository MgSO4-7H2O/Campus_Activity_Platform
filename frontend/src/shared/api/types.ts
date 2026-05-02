export type UserDto = {
  id: string
  username: string
  realName: string | null
  phone: string | null
  email: string | null
  userType: 'STUDENT' | 'TEACHER'
  status: 'ACTIVE' | 'DISABLED'
  createdAt: string
  updatedAt: string
  roles: string[]
  studentProfile: {
    userId: string
    college: string | null
    major: string | null
    grade: string | null
    className: string | null
    createdAt: string
    updatedAt: string
  } | null
  teacherProfile: {
    userId: string
    departmentName: string | null
    jobTitle: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type LoginResult = {
  accessToken: string
  user: {
    id: string
    username: string
    realName: string | null
    phone: string | null
    email: string | null
    userType: 'STUDENT' | 'TEACHER'
    status: 'ACTIVE' | 'DISABLED'
    createdAt: string
    updatedAt: string
    roles: string[]
  }
}

