import prisma from '../../shared/prisma/client.js'

export type UpdateUserBasicData = {
  realName?: string
  phone?: string
  email?: string
}

export type UpsertStudentProfileData = {
  college?: string
  major?: string
  grade?: number
  className?: string
}

export type UpsertTeacherProfileData = {
  departmentName?: string
  jobTitle?: string
}

export const usersRepository = {
  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: { include: { role: true } },
        studentProfile: true,
        teacherProfile: true,
      },
    })
  },

  updateUserById(id: string, data: UpdateUserBasicData) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        userRoles: { include: { role: true } },
        studentProfile: true,
        teacherProfile: true,
      },
    })
  },

  upsertStudentProfile(userId: string, data: UpsertStudentProfileData) {
    return prisma.studentProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })
  },

  upsertTeacherProfile(userId: string, data: UpsertTeacherProfileData) {
    return prisma.teacherProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })
  },
}