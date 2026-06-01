import prisma from '../../shared/prisma/client.js'
import { notFound } from '../../shared/errors/app-error.js'
import { assertUserHasRole } from '../../shared/auth/roles.js'
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js'
import { roleApplicationsService } from '../role-applications/role-applications.service.js'

function mapUserStatus(status: string) {
  return status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED'
}

export const adminService = {
  async listRoleApplications(userId: string, query: Record<string, unknown>) {
    await assertUserHasRole(userId, 'SYS_ADMIN')

    const { page, pageSize } = parsePagination(query)
    const status = typeof query.status === 'string' ? query.status : undefined

    const where: any = status ? { status } : {}

    const [apps, total] = await prisma.$transaction([
      prisma.roleApplication.findMany({
        where,
        include: {
          applicant: { select: { id: true, realName: true } },
          reviewer: { select: { id: true, realName: true } },
          organization: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.roleApplication.count({ where }),
    ])

    const items = apps.map((app) => ({
      id: app.id,
      applicantId: app.applicantId,
      applicantName: app.applicant?.realName ?? null,
      appliedRole: app.targetRoleCode,
      organizationId: app.organizationId,
      organizationName: app.organization?.name ?? null,
      reason: app.reason ?? '',
      status: app.status,
      reviewerId: app.reviewedBy,
      reviewerName: app.reviewer?.realName ?? null,
      reviewComment: app.reviewComment,
      submittedAt: app.submittedAt ? app.submittedAt.toISOString() : null,
      decisionAt: app.reviewedAt ? app.reviewedAt.toISOString() : null,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    }))

    return { items, meta: buildPaginationMeta(total, { page, pageSize }) }
  },

  async reviewRoleApplication(reviewerId: string, applicationId: string, data: { decision: 'APPROVE' | 'REJECT'; comment?: string }) {
    await assertUserHasRole(reviewerId, 'SYS_ADMIN')
    return roleApplicationsService.reviewRoleApplication(reviewerId, applicationId, data)
  },

  async listUsers(userId: string, query: Record<string, unknown>) {
    await assertUserHasRole(userId, 'SYS_ADMIN')

    const { page, pageSize } = parsePagination(query)
    const keyword = typeof query.keyword === 'string' ? query.keyword : undefined
    const role = typeof query.role === 'string' ? query.role : undefined
    const status = typeof query.status === 'string' ? query.status : undefined

    const where: any = {}
    if (keyword) {
      where.OR = [
        { username: { contains: keyword, mode: 'insensitive' } },
        { realName: { contains: keyword, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status === 'ACTIVE' ? 'ACTIVE' : 'BANNED'
    if (role) where.userRoles = { some: { role: { code: role } } }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        include: {
          userRoles: { include: { role: true } },
          userOrganizations: { include: { organization: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    const items = users.map((user) => ({
      id: user.id,
      username: user.username,
      realName: user.realName ?? null,
      email: user.email ?? null,
      phone: user.phone ?? null,
      userType: user.userType,
      status: mapUserStatus(user.status),
      roles: user.userRoles.map((r) => r.role.code),
      organizations: user.userOrganizations.map((uo) => ({
        id: uo.organizationId,
        name: uo.organization.name,
      })),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }))

    return { items, meta: buildPaginationMeta(total, { page, pageSize }) }
  },

  async getUserById(userId: string, targetUserId: string) {
    await assertUserHasRole(userId, 'SYS_ADMIN')

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        userRoles: { include: { role: true } },
        userOrganizations: { include: { organization: true } },
      },
    })

    if (!user) throw notFound('用户不存在')

    return {
      id: user.id,
      username: user.username,
      realName: user.realName ?? null,
      email: user.email ?? null,
      phone: user.phone ?? null,
      userType: user.userType,
      status: mapUserStatus(user.status),
      roles: user.userRoles.map((r) => r.role.code),
      organizations: user.userOrganizations.map((uo) => ({
        id: uo.organizationId,
        name: uo.organization.name,
      })),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  },

  async updateUserStatus(userId: string, targetUserId: string, status: 'ACTIVE' | 'DISABLED') {
    await assertUserHasRole(userId, 'SYS_ADMIN')

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { status: status === 'ACTIVE' ? 'ACTIVE' : 'BANNED' },
      include: {
        userRoles: { include: { role: true } },
        userOrganizations: { include: { organization: true } },
      },
    })

    return {
      id: updated.id,
      username: updated.username,
      realName: updated.realName ?? null,
      email: updated.email ?? null,
      phone: updated.phone ?? null,
      userType: updated.userType,
      status: mapUserStatus(updated.status),
      roles: updated.userRoles.map((r) => r.role.code),
      organizations: updated.userOrganizations.map((uo) => ({
        id: uo.organizationId,
        name: uo.organization.name,
      })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }
  },

  async listSystemLogs(userId: string, query: Record<string, unknown>) {
    await assertUserHasRole(userId, 'SYS_ADMIN')

    const { page, pageSize } = parsePagination(query)
    const action = typeof query.action === 'string' ? query.action : undefined
    const actorId = typeof query.actorId === 'string' ? query.actorId : undefined
    const resourceType = typeof query.resourceType === 'string' ? query.resourceType : undefined
    const resourceId = typeof query.resourceId === 'string' ? query.resourceId : undefined
    const from = typeof query.from === 'string' ? new Date(query.from) : undefined
    const to = typeof query.to === 'string' ? new Date(query.to) : undefined

    const where: any = {}
    if (action) where.action = action
    if (actorId) where.userId = actorId
    if (resourceType) where.resourceType = resourceType
    if (resourceId) where.resourceId = resourceId
    if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }

    const [logs, total] = await prisma.$transaction([
      prisma.systemLog.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.systemLog.count({ where }),
    ])

    const items = logs.map((log) => ({
      id: log.id.toString(),
      actorId: log.userId ?? null,
      actorName: log.user?.username ?? null,
      action: log.action,
      resourceType: log.resourceType ?? null,
      resourceId: log.resourceId ?? null,
      ip: log.ipAddress ?? null,
      userAgent: null,
      detail: (log.details as Record<string, unknown>) ?? null,
      createdAt: log.createdAt.toISOString(),
    }))

    return { items, meta: buildPaginationMeta(total, { page, pageSize }) }
  },

  async getDashboard(userId: string) {
    await assertUserHasRole(userId, 'SYS_ADMIN')

    const userCount = await prisma.user.count()
    const activeActivityCount = await prisma.activity.count({
      where: { status: { in: ['PLANNED', 'RECRUITING', 'ONGOING'] } },
    })
    const pendingApprovalCount = await prisma.pendingTask.count({
      where: { status: 'PENDING', taskType: { in: ['APPLICATION_REVIEW', 'CLOSURE_REVIEW'] } },
    })
    const pendingRoleApplicationCount = await prisma.roleApplication.count({
      where: { status: { in: ['SUBMITTED', 'APPROVING'] } },
    })

    const logs = await prisma.systemLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    const recentLogs = logs.map((log) => ({
      id: log.id.toString(),
      actorId: log.userId ?? null,
      actorName: log.user?.username ?? null,
      action: log.action,
      resourceType: log.resourceType ?? null,
      resourceId: log.resourceId ?? null,
      ip: log.ipAddress ?? null,
      userAgent: null,
      detail: (log.details as Record<string, unknown>) ?? null,
      createdAt: log.createdAt.toISOString(),
    }))

    return {
      userCount,
      activeActivityCount,
      pendingApprovalCount,
      pendingRoleApplicationCount,
      recentLogs,
    }
  },
}
