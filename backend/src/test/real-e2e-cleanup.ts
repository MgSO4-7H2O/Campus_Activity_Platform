import { pathToFileURL } from 'node:url'

import prisma from '../shared/prisma/client.js'

export type CleanupRealE2EUserResult = {
  username: string
  userId: string | null
  deleted: boolean
}

export class InvalidRealE2ECleanupTargetError extends Error {
  constructor(username: string) {
    super(`Refusing to cleanup non-E2E username: ${username}`)
    this.name = 'InvalidRealE2ECleanupTargetError'
  }
}

export class MissingRealE2EUsernameError extends Error {
  constructor() {
    super('Missing username argument for real E2E cleanup')
    this.name = 'MissingRealE2EUsernameError'
  }
}

type RealE2EResourceIds = {
  userId: string
  organizationIds: string[]
  roleApplicationIds: string[]
  activityApplicationIds: string[]
  activityIds: string[]
}

function assertRealE2EUsername(username: string): void {
  if (!/^real[a-z0-9]+$/.test(username)) {
    throw new InvalidRealE2ECleanupTargetError(username)
  }
}

export function buildRealE2EOrganizationName(username: string): string {
  assertRealE2EUsername(username)
  return `真实联调组织-${username}`
}

function readUsernameArg(argv: string[]): string {
  const username = argv[2]
  if (!username) {
    throw new MissingRealE2EUsernameError()
  }
  return username
}

function isCliEntry(argvEntry: string | undefined, moduleUrl: string): boolean {
  if (!argvEntry) {
    return false
  }
  return pathToFileURL(argvEntry).href === moduleUrl
}

async function collectRealE2EResourceIds(userId: string, username: string): Promise<RealE2EResourceIds> {
  const organizations = await prisma.organization.findMany({
    where: { name: buildRealE2EOrganizationName(username) },
    select: { id: true },
  })
  const organizationIds = organizations.map((organization) => organization.id)

  const roleApplications = await prisma.roleApplication.findMany({
    where: {
      OR: [
        { applicantId: userId },
        { organizationId: { in: organizationIds } },
      ],
    },
    select: { id: true },
  })
  const roleApplicationIds = roleApplications.map((application) => application.id)

  const activityApplications = await prisma.activityApplication.findMany({
    where: {
      OR: [
        { applicantId: userId },
        { organizationId: { in: organizationIds } },
      ],
    },
    select: { id: true },
  })
  const activityApplicationIds = activityApplications.map((application) => application.id)

  const activities = await prisma.activity.findMany({
    where: {
      OR: [
        { organizerId: userId },
        { organizationId: { in: organizationIds } },
        { applicationId: { in: activityApplicationIds } },
      ],
    },
    select: { id: true },
  })

  return {
    userId,
    organizationIds,
    roleApplicationIds,
    activityApplicationIds,
    activityIds: activities.map((activity) => activity.id),
  }
}

async function deleteRealE2EResources(ids: RealE2EResourceIds): Promise<void> {
  const relatedResourceIds = [
    ...ids.roleApplicationIds,
    ...ids.activityApplicationIds,
    ...ids.activityIds,
  ]

  await prisma.$transaction(async (tx) => {
    await tx.notificationReceipt.deleteMany({
      where: {
        notification: {
          OR: [
            { createdBy: ids.userId },
            { sourceId: { in: relatedResourceIds } },
          ],
        },
      },
    })
    await tx.notification.deleteMany({
      where: {
        OR: [
          { createdBy: ids.userId },
          { sourceId: { in: relatedResourceIds } },
        ],
      },
    })
    await tx.pendingTask.deleteMany({
      where: {
        OR: [
          { assigneeId: ids.userId },
          { createdBy: ids.userId },
          { relatedResourceId: { in: [...ids.roleApplicationIds, ...ids.activityApplicationIds] } },
        ],
      },
    })
    await tx.systemLog.deleteMany({
      where: {
        OR: [
          { userId: ids.userId },
          { resourceId: { in: relatedResourceIds } },
        ],
      },
    })
    await tx.activity.deleteMany({
      where: { id: { in: ids.activityIds } },
    })
    await tx.approvalRecord.deleteMany({
      where: { activityApplicationId: { in: ids.activityApplicationIds } },
    })
    await tx.applicationAttachment.deleteMany({
      where: { applicationId: { in: ids.activityApplicationIds } },
    })
    await tx.activityApplication.deleteMany({
      where: { id: { in: ids.activityApplicationIds } },
    })
    await tx.roleApplication.deleteMany({
      where: { id: { in: ids.roleApplicationIds } },
    })
    await tx.userOrganization.deleteMany({
      where: {
        OR: [
          { userId: ids.userId },
          { organizationId: { in: ids.organizationIds } },
        ],
      },
    })
    await tx.user.delete({
      where: { id: ids.userId },
    })
    await tx.organization.deleteMany({
      where: { id: { in: ids.organizationIds } },
    })
  })
}

export async function cleanupRealE2EUser(username: string): Promise<CleanupRealE2EUserResult> {
  assertRealE2EUsername(username)

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  })

  if (!user) {
    return {
      username,
      userId: null,
      deleted: false,
    }
  }

  const ids = await collectRealE2EResourceIds(user.id, username)
  await deleteRealE2EResources(ids)

  return {
    username,
    userId: user.id,
    deleted: true,
  }
}

if (isCliEntry(process.argv[1], import.meta.url)) {
  const result = await cleanupRealE2EUser(readUsernameArg(process.argv))
  console.log(JSON.stringify(result))
  await prisma.$disconnect()
}
