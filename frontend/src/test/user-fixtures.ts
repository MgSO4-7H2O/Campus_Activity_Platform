import type { UserDto } from '../shared/api/types'

export function createStudentUser(overrides: Partial<UserDto> = {}): UserDto {
  return {
    id: 'student-id',
    username: 'student1',
    realName: '测试学生',
    phone: '13800000001',
    email: 'student1@example.com',
    userType: 'STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z',
    roles: ['BASIC_USER'],
    studentProfile: {
      userId: 'student-id',
      college: '计算机学院',
      major: '软件工程',
      grade: '2024',
      className: '软工2401',
      createdAt: '2026-05-11T00:00:00.000Z',
      updatedAt: '2026-05-11T00:00:00.000Z',
    },
    teacherProfile: null,
    ...overrides,
  }
}

export function createTeacherUser(overrides: Partial<UserDto> = {}): UserDto {
  return {
    id: 'teacher-id',
    username: 'teacher1',
    realName: '测试教师',
    phone: '13800000002',
    email: 'teacher1@example.com',
    userType: 'TEACHER',
    status: 'ACTIVE',
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z',
    roles: ['BASIC_USER'],
    studentProfile: null,
    teacherProfile: {
      userId: 'teacher-id',
      departmentName: '计算机学院',
      jobTitle: '讲师',
      createdAt: '2026-05-11T00:00:00.000Z',
      updatedAt: '2026-05-11T00:00:00.000Z',
    },
    ...overrides,
  }
}
