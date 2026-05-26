import { expect, test, type Page } from '@playwright/test'

const sessionUser = {
  id: 'multi-role-user',
  username: 'multi-role',
  realName: '多角色测试用户',
  phone: '13800000009',
  email: 'multi-role@example.com',
  userType: 'TEACHER',
  status: 'ACTIVE',
  createdAt: '2026-05-11T00:00:00.000Z',
  updatedAt: '2026-05-11T00:00:00.000Z',
  roles: ['BASIC_USER', 'ORGANIZER', 'REVIEWER'],
}

async function setSession(page: Page, viewRole: string) {
  await page.addInitScript(
    ({ user, role }) => {
      window.localStorage.setItem(
        'cap-auth',
        JSON.stringify({
          state: {
            accessToken: 'e2e-token',
            user,
            viewRole: role,
          },
          version: 0,
        })
      )
    },
    { user: sessionUser, role: viewRole }
  )
}

test('组织者可从我的申请进入新建立项申请并触发表单校验', async ({ page }) => {
  await setSession(page, 'ORGANIZER')

  await page.goto('/applications')
  await expect(page.getByRole('heading', { name: '我的申请' })).toBeVisible()
  await expect(page.getByText('2026 春季编程马拉松')).toBeVisible()

  await page.getByRole('button', { name: '新建立项申请' }).click()
  await expect(page).toHaveURL(/\/applications\/new$/)
  await expect(page.getByRole('heading', { name: '活动立项申请' })).toBeVisible()

  await page.getByRole('button', { name: '提交申请' }).click()

  await expect(page.getByText('请输入活动名称')).toBeVisible()
  await expect(page.getByText('请选择发起组织')).toBeVisible()
})

test('审核人可从立项待办进入详情并提交通过确认', async ({ page }) => {
  await setSession(page, 'REVIEWER')

  await page.goto('/approvals')
  await expect(page.getByText('立项审核待办')).toBeVisible()

  await page.getByRole('button', { name: '立即审核' }).first().click()
  await expect(page).toHaveURL(/\/approvals\/app-001$/)
  await expect(page.getByRole('heading', { name: '审核详情' })).toBeVisible()

  await page.getByPlaceholder('请填写审核意见（驳回 / 要求补材料时为必填）').fill('材料完整，同意通过。')
  await page.getByRole('button', { name: '通过' }).click()
  await expect(page.getByText('确认通过该申请？')).toBeVisible()

  await page.getByRole('button', { name: '确 定' }).click()
  await expect(page).toHaveURL(/\/approvals$/)
})
