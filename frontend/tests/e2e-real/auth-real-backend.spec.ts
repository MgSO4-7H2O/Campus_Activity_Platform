import { expect, test } from '@playwright/test'

import {
  cleanupCreatedStudent,
  createUniqueStudent,
  realE2EPassword,
  type CreatedStudent,
} from './real-backend-helpers'

test('真实后端和 PostgreSQL 支持注册、完善资料、退出后重新登录闭环', async ({ page, request }) => {
  const student = createUniqueStudent()
  let createdStudent: CreatedStudent | null = null

  try {
    await page.goto('/register')
    await page.getByLabel('用户名').fill(student.username)
    await page.getByLabel('密码').fill(realE2EPassword)
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
      password: realE2EPassword,
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
    await page.getByLabel('密码').fill(realE2EPassword)
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
