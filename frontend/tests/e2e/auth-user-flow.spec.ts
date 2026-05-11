import { expect, test, type Page } from '@playwright/test'

const studentUser = {
  id: 'student-id',
  username: 'student-e2e',
  realName: '测试学生',
  phone: '13800000001',
  email: 'student-e2e@example.com',
  userType: 'STUDENT',
  status: 'ACTIVE',
  createdAt: '2026-05-11T00:00:00.000Z',
  updatedAt: '2026-05-11T00:00:00.000Z',
  roles: ['BASIC_USER'],
  studentProfile: {
    userId: 'student-id',
    college: '计算机学院',
    major: '软件工程',
    grade: 2024,
    className: '软工2401',
  },
  teacherProfile: null,
}

async function mockUserApis(page: Page) {
  await page.route('**/api/v1/auth/register', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          accessToken: 'e2e-token',
          user: {
            id: studentUser.id,
            username: studentUser.username,
            realName: studentUser.realName,
            phone: studentUser.phone,
            email: studentUser.email,
            userType: studentUser.userType,
            status: studentUser.status,
            createdAt: studentUser.createdAt,
            updatedAt: studentUser.updatedAt,
            roles: studentUser.roles,
          },
        },
      }),
    })
  })

  await page.route('**/api/v1/users/me', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: studentUser }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          ...studentUser,
          realName: '测试学生已更新',
          email: 'updated@example.com',
        },
      }),
    })
  })

  await page.route('**/api/v1/users/me/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          ...studentUser,
          studentProfile: {
            ...studentUser.studentProfile,
            college: '测试学院',
          },
        },
      }),
    })
  })
}

test('注册登录用户信息闭环可在前端完成', async ({ page }) => {
  await mockUserApis(page)

  await page.goto('/register')
  await page.getByLabel('用户名').fill('student-e2e')
  await page.getByLabel('密码').fill('Password123!')
  await page.getByLabel('真实姓名').fill('测试学生')
  await page.getByLabel('邮箱').fill('student-e2e@example.com')
  await page.getByLabel('手机号').fill('13800000001')
  await page.getByRole('button', { name: '注册并登录' }).click()

  await expect(page).toHaveURL(/\/me\/profile$/)
  await expect(page.getByLabel('学院')).toBeVisible()

  await page.getByLabel('学院').fill('测试学院')
  await page.getByRole('button', { name: /保\s*存/ }).click()

  await expect(page).toHaveURL(/\/me$/)
  await expect(page.getByText('账号资料', { exact: true })).toBeVisible()
  await expect(page.getByRole('main').getByText('测试学生')).toBeVisible()

  await page.getByRole('banner').getByText('测试学生').hover()
  await page.getByRole('menuitem', { name: /退出登录/ }).click()

  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/me')
  await expect(page).toHaveURL(/\/login$/)
})
