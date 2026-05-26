import prisma from '../../shared/prisma/client.js'
import { badRequest, notFound } from '../../shared/errors/app-error.js'
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js'
import { assertUserHasAnyRole } from '../../shared/auth/roles.js'

function toDto(recruitment: any, allowedMajors: string[]) {
  const allowedUserTypes =
    recruitment.targetUserType === 'ALL'
      ? ['STUDENT', 'TEACHER']
      : [recruitment.targetUserType]

  const allowedGrades: string[] = []
  if (recruitment.minGrade && recruitment.maxGrade) {
    for (let grade = recruitment.minGrade; grade <= recruitment.maxGrade; grade += 1) {
      allowedGrades.push(String(grade))
    }
  }

  return {
    id: recruitment.id,
    activityId: recruitment.activityId,
    title: recruitment.title,
    status: recruitment.status,
    capacity: recruitment.quota ?? 0,
    registrationStart: recruitment.signupStartTime ? recruitment.signupStartTime.toISOString() : new Date().toISOString(),
    registrationEnd: recruitment.signupEndTime ? recruitment.signupEndTime.toISOString() : new Date().toISOString(),
    allowedUserTypes,
    allowedGrades,
    allowedMajors,
    requiresAttachment: recruitment.requiresAttachment,
    publishedAt: null,
    closedAt: null,
    createdAt: recruitment.createdAt.toISOString(),
    updatedAt: recruitment.updatedAt.toISOString(),
  }
}

function toDbTargetUserType(userTypes: string[]) {
  if (userTypes.includes('STUDENT') && userTypes.includes('TEACHER')) return 'ALL'
  return userTypes[0] ?? 'ALL'
}

export const recruitmentService = {
  async createRecruitment(userId: string, input: any) {
    const activity = await prisma.activity.findUnique({ where: { id: input.activityId } })
    if (!activity) throw notFound('活动不存在')
    if (activity.organizerId !== userId) {
      await assertUserHasAnyRole(userId, ['SYS_ADMIN'])
    }

    const gradeNumbers = (input.allowedGrades ?? []).map(Number).filter((g: number) => Number.isFinite(g))
    const minGrade = gradeNumbers.length ? Math.min(...gradeNumbers) : null
    const maxGrade = gradeNumbers.length ? Math.max(...gradeNumbers) : null

    const recruitment = await prisma.recruitment.create({
      data: {
        activityId: input.activityId,
        title: input.title,
        quota: input.capacity,
        signupStartTime: new Date(input.registrationStart),
        signupEndTime: new Date(input.registrationEnd),
        targetUserType: toDbTargetUserType(input.allowedUserTypes),
        minGrade,
        maxGrade,
        requiresAttachment: input.requiresAttachment,
        status: 'DRAFT',
      },
    })

    if (input.allowedMajors?.length) {
      await prisma.recruitmentAllowedMajor.createMany({
        data: input.allowedMajors.map((major: string) => ({
          recruitmentId: recruitment.id,
          majorName: major,
        })),
      })
    }

    return toDto(recruitment, input.allowedMajors ?? [])
  },

  async listRecruitments(query: Record<string, unknown>) {
    const { page, pageSize } = parsePagination(query)
    const status = typeof query.status === 'string' ? query.status : undefined

    const where = status ? { status } : {}

    const [items, total] = await prisma.$transaction([
      prisma.recruitment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recruitment.count({ where }),
    ])

    const allowedMajors = await prisma.recruitmentAllowedMajor.findMany({
      where: { recruitmentId: { in: items.map((i) => i.id) } },
    })

    const majorsMap = new Map<string, string[]>()
    allowedMajors.forEach((row) => {
      const list = majorsMap.get(row.recruitmentId) ?? []
      list.push(row.majorName)
      majorsMap.set(row.recruitmentId, list)
    })

    return {
      items: items.map((item) => toDto(item, majorsMap.get(item.id) ?? [])),
      meta: buildPaginationMeta(total, { page, pageSize }),
    }
  },

  async getRecruitmentById(id: string) {
    const recruitment = await prisma.recruitment.findUnique({ where: { id } })
    if (!recruitment) throw notFound('招募不存在')

    const majors = await prisma.recruitmentAllowedMajor.findMany({ where: { recruitmentId: id } })
    return toDto(recruitment, majors.map((m) => m.majorName))
  },

  async updateRecruitment(userId: string, id: string, input: any) {
    const recruitment = await prisma.recruitment.findUnique({ where: { id } })
    if (!recruitment) throw notFound('招募不存在')
    if (recruitment.status !== 'DRAFT') throw badRequest('仅草稿可编辑')

    const activity = await prisma.activity.findUnique({ where: { id: recruitment.activityId } })
    if (!activity) throw notFound('活动不存在')
    if (activity.organizerId !== userId) {
      await assertUserHasAnyRole(userId, ['SYS_ADMIN'])
    }

    const gradeNumbers = (input.allowedGrades ?? []).map(Number).filter((g: number) => Number.isFinite(g))
    const minGrade = gradeNumbers.length ? Math.min(...gradeNumbers) : null
    const maxGrade = gradeNumbers.length ? Math.max(...gradeNumbers) : null

    const updated = await prisma.recruitment.update({
      where: { id },
      data: {
        title: input.title,
        quota: input.capacity,
        signupStartTime: input.registrationStart ? new Date(input.registrationStart) : undefined,
        signupEndTime: input.registrationEnd ? new Date(input.registrationEnd) : undefined,
        targetUserType: input.allowedUserTypes ? toDbTargetUserType(input.allowedUserTypes) : undefined,
        minGrade,
        maxGrade,
        requiresAttachment: input.requiresAttachment,
      },
    })

    if (input.allowedMajors) {
      await prisma.recruitmentAllowedMajor.deleteMany({ where: { recruitmentId: id } })
      if (input.allowedMajors.length) {
        await prisma.recruitmentAllowedMajor.createMany({
          data: input.allowedMajors.map((major: string) => ({
            recruitmentId: id,
            majorName: major,
          })),
        })
      }
    }

    const majors = await prisma.recruitmentAllowedMajor.findMany({ where: { recruitmentId: id } })
    return toDto(updated, majors.map((m) => m.majorName))
  },

  async publishRecruitment(userId: string, id: string) {
    const recruitment = await prisma.recruitment.findUnique({ where: { id } })
    if (!recruitment) throw notFound('招募不存在')

    const activity = await prisma.activity.findUnique({ where: { id: recruitment.activityId } })
    if (!activity) throw notFound('活动不存在')
    if (activity.organizerId !== userId) {
      await assertUserHasAnyRole(userId, ['SYS_ADMIN'])
    }

    const updated = await prisma.recruitment.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    })

    if (activity.status === 'PLANNED') {
      await prisma.activity.update({
        where: { id: activity.id },
        data: { status: 'RECRUITING' },
      })
    }

    const majors = await prisma.recruitmentAllowedMajor.findMany({ where: { recruitmentId: id } })
    return toDto(updated, majors.map((m) => m.majorName))
  },

  async closeRecruitment(userId: string, id: string) {
    const recruitment = await prisma.recruitment.findUnique({ where: { id } })
    if (!recruitment) throw notFound('招募不存在')

    const activity = await prisma.activity.findUnique({ where: { id: recruitment.activityId } })
    if (!activity) throw notFound('活动不存在')
    if (activity.organizerId !== userId) {
      await assertUserHasAnyRole(userId, ['SYS_ADMIN'])
    }

    const updated = await prisma.recruitment.update({
      where: { id },
      data: { status: 'CLOSED' },
    })

    const majors = await prisma.recruitmentAllowedMajor.findMany({ where: { recruitmentId: id } })
    return toDto(updated, majors.map((m) => m.majorName))
  },
}
