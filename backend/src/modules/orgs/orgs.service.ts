import prisma from '../../shared/prisma/client.js'
import { badRequest, notFound } from '../../shared/errors/app-error.js'
import { assertUserHasRole } from '../../shared/auth/roles.js'

function toDto(org: any) {
  return {
    id: org.id,
    name: org.name,
    type: org.type === 'CLUB'
      ? 'club'
      : org.type === 'STUDENT_ORGANIZATION'
        ? 'student_organization'
        : 'administration',
    parentOrgId: org.parentOrgId,
    status: org.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
    description: org.description,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  }
}

function toNode(org: any, children: any[]) {
  return {
    ...toDto(org),
    children,
  }
}

function toDbType(type: string) {
  if (type === 'club') return 'CLUB'
  if (type === 'student_organization') return 'STUDENT_ORGANIZATION'
  return 'ADMINISTRATION'
}

function toDbStatus(status: string) {
  return status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
}

function buildOrgCode(name: string) {
  const base = name.replace(/\s+/g, '-').toUpperCase().slice(0, 12)
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `ORG-${base}-${suffix}`
}

export const orgsService = {
  async listOrganizations(query: { type?: string; status?: string }) {
    const where: any = {}
    if (query.type) where.type = toDbType(query.type)
    if (query.status) where.status = toDbStatus(query.status)

    const orgs = await prisma.organization.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    })

    return orgs.map(toDto)
  },

  async getOrganizationTree() {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'asc' },
    })

    const map = new Map<string, any>()
    orgs.forEach((org) => {
      map.set(org.id, { org, children: [] as any[] })
    })

    const roots: any[] = []
    map.forEach((node) => {
      if (node.org.parentOrgId && map.has(node.org.parentOrgId)) {
        map.get(node.org.parentOrgId)!.children.push(node)
      } else {
        roots.push(node)
      }
    })

    const build = (node: any): any => toNode(node.org, node.children.map(build))

    return roots.map(build)
  },

  async getOrganizationById(id: string) {
    const org = await prisma.organization.findUnique({ where: { id } })
    if (!org) throw notFound('组织不存在')
    return toDto(org)
  },

  async createOrganization(userId: string, input: any) {
    await assertUserHasRole(userId, 'SYS_ADMIN')

    const created = await prisma.organization.create({
      data: {
        orgCode: buildOrgCode(input.name),
        name: input.name,
        type: toDbType(input.type),
        parentOrgId: input.parentOrgId,
        description: input.description,
        status: 'ACTIVE',
      },
    })

    return toDto(created)
  },

  async updateOrganization(userId: string, id: string, input: any) {
    await assertUserHasRole(userId, 'SYS_ADMIN')

    const org = await prisma.organization.findUnique({ where: { id } })
    if (!org) throw notFound('组织不存在')

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        name: input.name,
        type: input.type ? toDbType(input.type) : undefined,
        parentOrgId: input.parentOrgId,
        description: input.description,
        status: input.status ? toDbStatus(input.status) : undefined,
      },
    })

    return toDto(updated)
  },

  async addUserOrganization(userId: string, targetUserId: string, input: { organizationId: string; role?: string }) {
    await assertUserHasRole(userId, 'SYS_ADMIN')

    const org = await prisma.organization.findUnique({ where: { id: input.organizationId } })
    if (!org) throw notFound('组织不存在')

    const existing = await prisma.userOrganization.findFirst({
      where: { userId: targetUserId, organizationId: input.organizationId },
    })

    if (existing) throw badRequest('用户已在该组织中')

    const created = await prisma.userOrganization.create({
      data: {
        userId: targetUserId,
        organizationId: input.organizationId,
      },
      include: { organization: true },
    })

    return {
      userId: created.userId,
      organizationId: created.organizationId,
      organizationName: created.organization.name,
      role: input.role ?? 'MEMBER',
      createdAt: created.assignedAt.toISOString(),
    }
  },

  async removeUserOrganization(userId: string, targetUserId: string, organizationId: string) {
    await assertUserHasRole(userId, 'SYS_ADMIN')

    await prisma.userOrganization.delete({
      where: { userId_organizationId: { userId: targetUserId, organizationId } },
    })
  },

  async listUserOrganizations(userId: string, targetUserId: string) {
    await assertUserHasRole(userId, 'SYS_ADMIN')

    const orgs = await prisma.userOrganization.findMany({
      where: { userId: targetUserId },
      include: { organization: true },
    })

    return orgs.map((record) => ({
      userId: record.userId,
      organizationId: record.organizationId,
      organizationName: record.organization.name,
      role: 'MEMBER',
      createdAt: record.assignedAt.toISOString(),
    }))
  },
}
