import { expect, test } from '@playwright/test'

test('活动列表页面可正常渲染', async ({ page }) => {
  await page.route('**/api/v1/activities?**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: [], meta: { total: 0, page: 1, pageSize: 20 } }) })
  })
  await page.goto('/activities')
  await expect(page.getByRole('heading', { name: '活动列表' })).toBeVisible()
})

test('组织架构页面可正常渲染', async ({ page }) => {
  await page.route('**/api/v1/organizations/tree', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) })
  })
  await page.goto('/organizations')
  await expect(page.getByRole('heading', { name: '组织架构' })).toBeVisible()
})
