import { expect, test } from '@playwright/test'

test('登录页面可正常渲染', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText('欢迎登录')).toBeVisible()
  await expect(page.getByPlaceholder('如 student1')).toBeVisible()
  await expect(page.getByPlaceholder('至少 8 位')).toBeVisible()
})

test('注册页面可正常渲染', async ({ page }) => {
  await page.goto('/register')
  await expect(page.getByText('注册新账号')).toBeVisible()
})
