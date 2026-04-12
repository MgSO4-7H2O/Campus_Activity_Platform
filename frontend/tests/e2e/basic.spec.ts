import { expect, test } from '@playwright/test'

test('home renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('骨架已启动')).toBeVisible()
})

