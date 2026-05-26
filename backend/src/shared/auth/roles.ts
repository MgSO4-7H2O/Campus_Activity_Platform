import prisma from '../prisma/client.js'
import { forbidden } from '../errors/app-error.js'

export async function getUserRoleCodes(userId: string) {
  const roles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  })

  return roles.map((r) => r.role.code)
}

export async function assertUserHasRole(userId: string, role: string) {
  const roles = await getUserRoleCodes(userId)
  if (!roles.includes(role)) {
    throw forbidden('权限不足')
  }

  return roles
}

export async function assertUserHasAnyRole(userId: string, roles: string[]) {
  const userRoles = await getUserRoleCodes(userId)
  const ok = roles.some((role) => userRoles.includes(role))
  if (!ok) {
    throw forbidden('权限不足')
  }

  return userRoles
}
