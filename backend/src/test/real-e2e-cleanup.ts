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

function assertRealE2EUsername(username: string): void {
  if (!/^real[a-z0-9]+$/.test(username)) {
    throw new InvalidRealE2ECleanupTargetError(username)
  }
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

  await prisma.user.delete({
    where: { id: user.id },
  })

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
