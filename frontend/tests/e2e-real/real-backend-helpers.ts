import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, type APIRequestContext, type APIResponse } from '@playwright/test'

export const realE2EPassword = 'Password123!'
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

export type CleanupResult = {
  username: string
  userId: string | null
  deleted: boolean
}

export type CreatedStudent = {
  username: string
  password: string
}

export type UniqueStudent = {
  username: string
  realName: string
  email: string
  phone: string
}

export type RealE2EActors = {
  adminUsername: string
  reviewerUsername: string
}

type ApiData<T> = {
  data: T
}

function isCleanupResult(value: unknown): value is CleanupResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'username' in value &&
    'userId' in value &&
    'deleted' in value &&
    typeof value.username === 'string' &&
    (typeof value.userId === 'string' || value.userId === null) &&
    typeof value.deleted === 'boolean'
  )
}

function parseCleanupResult(output: string): CleanupResult {
  const lines = output.trim().split(/\r?\n/).filter(Boolean)
  const resultLine = lines[lines.length - 1]
  if (!resultLine) {
    throw new Error('Real E2E cleanup did not return a result')
  }

  const result: unknown = JSON.parse(resultLine)
  if (!isCleanupResult(result)) {
    throw new Error(`Invalid real E2E cleanup result: ${resultLine}`)
  }

  return result
}

export function cleanupRealE2EUser(username: string): CleanupResult {
  const output = execFileSync(
    'pnpm',
    ['--filter', '@campus-activity/server', 'exec', 'tsx', 'src/test/real-e2e-cleanup.ts', username],
    {
      cwd: rootDir,
      encoding: 'utf8',
      env: process.env,
    }
  )

  return parseCleanupResult(output)
}

export function createUniqueStudent(): UniqueStudent {
  const suffix = Date.now().toString(36)
  const phoneSuffix = String(Date.now() % 100_000_000).padStart(8, '0')

  return {
    username: `real${suffix}`.slice(0, 20),
    realName: `真实联调${suffix}`,
    email: `real-${suffix}@example.com`,
    phone: `138${phoneSuffix}`,
  }
}

export function buildRealE2EOrganizationName(username: string): string {
  return `真实联调组织-${username}`
}

export function createUniqueActorUsernames(): RealE2EActors {
  const suffix = Date.now().toString(36)
  return {
    adminUsername: `realadmin${suffix}`.slice(0, 20),
    reviewerUsername: `realreviewer${suffix}`.slice(0, 20),
  }
}

export function ensureRealE2EActors(actors: RealE2EActors): RealE2EActors {
  const output = execFileSync(
    'pnpm',
    [
      '--filter',
      '@campus-activity/server',
      'exec',
      'tsx',
      'src/test/real-e2e-actors.ts',
      actors.adminUsername,
      actors.reviewerUsername,
    ],
    {
      cwd: rootDir,
      encoding: 'utf8',
      env: process.env,
    }
  )
  const lines = output.trim().split(/\r?\n/).filter(Boolean)
  const resultLine = lines[lines.length - 1]
  if (!resultLine) {
    throw new Error('Real E2E actor setup did not return a result')
  }
  return JSON.parse(resultLine) as RealE2EActors
}

export function bearerHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

export async function readApiData<T>(response: APIResponse, expectedStatus: number): Promise<T> {
  if (response.status() !== expectedStatus) {
    const body = await response.text()
    expect(response.status(), body).toBe(expectedStatus)
  }
  const body = (await response.json()) as ApiData<T>
  return body.data
}

export async function loginRealUser(request: APIRequestContext, username: string): Promise<string> {
  const data = await readApiData<{ accessToken: string }>(
    await request.post('http://localhost:3100/api/v1/auth/login', {
      data: {
        username,
        password: realE2EPassword,
      },
    }),
    200
  )

  return data.accessToken
}

export async function cleanupCreatedStudent(request: APIRequestContext, createdStudent: CreatedStudent): Promise<void> {
  const cleanupResult = cleanupRealE2EUser(createdStudent.username)
  expect(cleanupResult).toEqual({
    username: createdStudent.username,
    userId: expect.any(String),
    deleted: true,
  })

  const loginResponse = await request.post('http://localhost:3100/api/v1/auth/login', {
    data: {
      username: createdStudent.username,
      password: createdStudent.password,
    },
  })
  expect(loginResponse.status()).toBe(401)
}
