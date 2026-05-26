import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, type APIRequestContext, test } from '@playwright/test'

const password = 'Password123!'
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

type CleanupResult = {
  username: string
  userId: string | null
  deleted: boolean
}

type CreatedStudent = {
  username: string
  password: string
}

type UniqueStudent = {
  username: string
  realName: string
  email: string
  phone: string
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

function cleanupRealE2EUser(username: string): CleanupResult {
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

function createUniqueStudent(): UniqueStudent {
  const suffix = Date.now().toString(36)
  const phoneSuffix = String(Date.now() % 100_000_000).padStart(8, '0')

  return {
    username: `real${suffix}`.slice(0, 20),
    realName: `真实联调${suffix}`,
    email: `real-${suffix}@example.com`,
    phone: `138${phoneSuffix}`,
  }
}

async function cleanupCreatedStudent(request: APIRequestContext, createdStudent: CreatedStudent): Promise<void> {
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

test('真实后端和 PostgreSQL 支持注册、完善资料、退出后重新登录闭环', async ({ page, request }) => {
  const student = createUniqueStudent()
  let createdStudent: CreatedStudent | null = null

  try {
    await page.goto('/register')
    await page.getByLabel('用户名').fill(student.username)
    await page.getByLabel('密码').fill(password)
    await page.getByLabel('真实姓名').fill(student.realName)
    await page.getByLabel('邮箱').fill(student.email)
    await page.getByLabel('手机号').fill(student.phone)
    const registerResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/auth/register') && response.request().method() === 'POST'
    )
    await page.getByRole('button', { name: '注册并登录' }).click()
    const registerResponse = await registerResponsePromise
    expect(registerResponse.status()).toBe(201)
    createdStudent = {
      username: student.username,
      password,
    }

    await expect(page).toHaveURL(/\/me\/profile$/)
    await page.getByLabel('学院').fill('真实联调学院')
    await page.getByLabel('专业').fill('软件工程')
    await page.getByLabel('年级').fill('2026')
    await page.getByLabel('班级').fill('联调2601')
    await page.getByRole('button', { name: /保\s*存/ }).click()

    await expect(page).toHaveURL(/\/me$/)
    await expect(page.getByRole('main').getByText(student.realName)).toBeVisible()
    await expect(page.getByText('真实联调学院')).toBeVisible()
    await expect(page.getByText('软件工程')).toBeVisible()

    await page.getByRole('banner').getByText(student.realName).hover()
    await page.getByRole('menuitem', { name: /退出登录/ }).click()
    await expect(page).toHaveURL(/\/login$/)

    await page.getByLabel('用户名').fill(student.username)
    await page.getByLabel('密码').fill(password)
    await page.getByRole('main').getByRole('button', { name: /登\s*录/ }).click()

    await expect(page).toHaveURL(/\/me$/)
    await expect(page.getByRole('main').getByText(student.realName)).toBeVisible()
    await expect(page.getByText('真实联调学院')).toBeVisible()
  } finally {
    if (createdStudent) {
      await cleanupCreatedStudent(request, createdStudent)
    }
  }
})
