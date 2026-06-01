import { expect, test, type Page } from '@playwright/test'

const studentUser = {
  id: 'student-flow-user',
  username: 'student-flow',
  realName: '报名流程学生',
  phone: '13800000021',
  email: 'student-flow@example.com',
  userType: 'STUDENT',
  status: 'ACTIVE',
  createdAt: '2026-05-11T00:00:00.000Z',
  updatedAt: '2026-05-11T00:00:00.000Z',
  roles: ['BASIC_USER'],
  studentProfile: {
    userId: 'student-flow-user',
    college: '计算机学院',
    major: '软件工程',
    grade: 2024,
    className: '软工2401',
  },
  teacherProfile: null,
}

const organizerUser = {
  id: 'organizer-flow-user',
  username: 'organizer-flow',
  realName: '签到流程负责人',
  phone: '13800000022',
  email: 'organizer-flow@example.com',
  userType: 'STUDENT',
  status: 'ACTIVE',
  createdAt: '2026-05-11T00:00:00.000Z',
  updatedAt: '2026-05-11T00:00:00.000Z',
  roles: ['BASIC_USER', 'ORGANIZER'],
  studentProfile: {
    userId: 'organizer-flow-user',
    college: '计算机学院',
    major: '软件工程',
    grade: 2024,
    className: '软工2402',
  },
  teacherProfile: null,
}

async function setSession(page: Page, user: typeof studentUser, viewRole: string): Promise<void> {
  await page.addInitScript(
    ({ sessionUser, role }) => {
      window.localStorage.setItem(
        'cap-auth',
        JSON.stringify({
          state: {
            accessToken: 'e2e-token',
            user: sessionUser,
            viewRole: role,
          },
          version: 0,
        })
      )
    },
    { sessionUser: user, role: viewRole }
  )
}

test('学生可从活动列表完成报名并进入签到页', async ({ page }) => {
  await setSession(page, studentUser, 'BASIC_USER')

  await page.goto('/activities')
  await expect(page.getByRole('heading', { name: '活动列表' })).toBeVisible()
  await page.getByTitle('招募中').click()

  const activityCard = page.locator('.ant-card').filter({ hasText: '2026 春季编程马拉松' }).first()
  await activityCard.getByRole('link', { name: '查看' }).click()

  await expect(page).toHaveURL(/\/activities\/act-001$/)
  await expect(page.getByText('计算机科学与技术学院')).toBeVisible()

  await page.getByRole('button', { name: '立即报名' }).click()
  await expect(page).toHaveURL(/\/activities\/act-001\/register$/)
  await expect(page.getByRole('heading', { name: '报名' })).toBeVisible()
  await page.getByLabel('备注（可选）').fill('我有算法竞赛经历，希望参与后端开发。')
  await page.getByRole('button', { name: '提交报名' }).click()

  await expect(page).toHaveURL(/\/my\/registrations$/)
  await expect(page.getByRole('heading', { name: '我的报名' })).toBeVisible()
  await expect(page.getByText('2026 春季编程马拉松').first()).toBeVisible()
  await expect(page.getByText('待审核')).toBeVisible()
  await expect(page.getByText('已通过')).toBeVisible()

  await page.getByRole('button', { name: '去签到' }).click()
  await expect(page).toHaveURL(/\/activities\/act-001\/checkin$/)
  await expect(page.getByRole('heading', { name: '活动签到' })).toBeVisible()
  const checkinCodeAlert = page.getByRole('alert').filter({ hasText: '538291' })
  await expect(checkinCodeAlert.getByText('签到码')).toBeVisible()
  await expect(checkinCodeAlert.getByText('538291')).toBeVisible()
})

test('组织者可创建签到码场次并立即查看新场次', async ({ page }) => {
  await setSession(page, organizerUser, 'ORGANIZER')

  await page.goto('/activities/act-001/checkin')
  await expect(page.getByRole('heading', { name: '活动签到' })).toBeVisible()
  await expect(page.getByText('Day 1 · 上午签到', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: '创建签到场次' }).click()
  await page.getByLabel('场次名称').fill('验收签到场次')
  await page.getByLabel('签到码（仅签到码方式需要）').fill('246810')
  await page.getByRole('button', { name: '确定创建' }).click()

  await expect(page.getByText('验收签到场次', { exact: true })).toBeVisible()
  const newCodeAlert = page.getByRole('alert').filter({ hasText: '246810' })
  await expect(newCodeAlert.getByText('246810')).toBeVisible()
  await expect(page.getByText('已签到')).toBeVisible()
  await expect(page.getByText('/ 120')).toBeVisible()
})
