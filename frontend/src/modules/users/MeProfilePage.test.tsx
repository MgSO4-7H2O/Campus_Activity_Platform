import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { message } from 'antd'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createStudentUser, createTeacherUser } from '../../test/user-fixtures'
import { getMe, updateMyProfile } from '../../shared/api/users'
import { useAuthStore } from '../../shared/auth/store'
import MeProfilePage from './MeProfilePage'

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }
})

vi.mock('../../shared/api/users', () => ({
  getMe: vi.fn(),
  updateMyProfile: vi.fn(),
}))

const mockedGetMe = vi.mocked(getMe)
const mockedUpdateMyProfile = vi.mocked(updateMyProfile)
const mockedMessage = vi.mocked(message)

function renderMeProfilePage() {
  render(
    <MemoryRouter initialEntries={['/me/profile']}>
      <Routes>
        <Route path="/me/profile" element={<MeProfilePage />} />
        <Route path="/me" element={<div>个人中心页</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('MeProfilePage', () => {
  beforeEach(() => {
    mockedGetMe.mockReset()
    mockedUpdateMyProfile.mockReset()
    mockedMessage.success.mockReset()
    mockedMessage.error.mockReset()
    useAuthStore.getState().logout()
  })

  it('学生用户渲染学生扩展资料字段', async () => {
    mockedGetMe.mockResolvedValue(createStudentUser())

    renderMeProfilePage()

    expect(await screen.findByLabelText('学院')).toBeInTheDocument()
    expect(screen.getByLabelText('专业')).toBeInTheDocument()
    expect(screen.getByLabelText('年级')).toBeInTheDocument()
    expect(screen.getByLabelText('班级')).toBeInTheDocument()
    expect(screen.queryByLabelText('部门')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('职称')).not.toBeInTheDocument()
  })

  it('教师用户渲染教师扩展资料字段', async () => {
    mockedGetMe.mockResolvedValue(createTeacherUser())

    renderMeProfilePage()

    expect(await screen.findByLabelText('部门')).toBeInTheDocument()
    expect(screen.getByLabelText('职称')).toBeInTheDocument()
    expect(screen.queryByLabelText('学院')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('专业')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('年级')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('班级')).not.toBeInTheDocument()
  })

  it('saves student profile, updates auth store, and redirects to profile page', async () => {
    const user = userEvent.setup()
    const updated = createStudentUser({
      studentProfile: {
        userId: 'student-id',
        college: '信息学院',
        major: '人工智能',
        grade: '2025',
        className: '智科2501',
        createdAt: '2026-05-11T00:00:00.000Z',
        updatedAt: '2026-05-11T00:00:00.000Z',
      },
    })
    mockedGetMe.mockResolvedValue(createStudentUser())
    mockedUpdateMyProfile.mockResolvedValue(updated)

    renderMeProfilePage()

    await user.clear(await screen.findByLabelText('学院'))
    await user.type(screen.getByLabelText('学院'), '信息学院')
    await user.clear(screen.getByLabelText('专业'))
    await user.type(screen.getByLabelText('专业'), '人工智能')
    await user.clear(screen.getByLabelText('年级'))
    await user.type(screen.getByLabelText('年级'), '2025')
    await user.clear(screen.getByLabelText('班级'))
    await user.type(screen.getByLabelText('班级'), '智科2501')
    await user.click(screen.getByRole('button', { name: /保\s*存/ }))

    await screen.findByText('个人中心页')
    expect(mockedUpdateMyProfile).toHaveBeenCalledWith({
      college: '信息学院',
      major: '人工智能',
      grade: 2025,
      className: '智科2501',
    })
    expect(useAuthStore.getState().user?.realName).toBe(updated.realName)
    expect(mockedMessage.success).toHaveBeenCalledWith('已保存')
  })

  it('shows backend error and keeps student profile input when save fails', async () => {
    const user = userEvent.setup()
    mockedGetMe.mockResolvedValue(createStudentUser())
    mockedUpdateMyProfile.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { message: '年级必须是数字' } } },
    })

    renderMeProfilePage()

    await user.clear(await screen.findByLabelText('专业'))
    await user.type(screen.getByLabelText('专业'), '数学')
    await user.click(screen.getByRole('button', { name: /保\s*存/ }))

    await waitFor(() => {
      expect(mockedMessage.error).toHaveBeenCalledWith('年级必须是数字')
    })
    expect(screen.queryByText('个人中心页')).not.toBeInTheDocument()
    expect(screen.getByLabelText('专业')).toHaveValue('数学')
  })

  it('saves teacher profile and redirects to profile page', async () => {
    const user = userEvent.setup()
    const updated = createTeacherUser({
      teacherProfile: {
        userId: 'teacher-id',
        departmentName: '软件学院',
        jobTitle: '副教授',
        createdAt: '2026-05-11T00:00:00.000Z',
        updatedAt: '2026-05-11T00:00:00.000Z',
      },
    })
    mockedGetMe.mockResolvedValue(createTeacherUser())
    mockedUpdateMyProfile.mockResolvedValue(updated)

    renderMeProfilePage()

    await user.clear(await screen.findByLabelText('部门'))
    await user.type(screen.getByLabelText('部门'), '软件学院')
    await user.clear(screen.getByLabelText('职称'))
    await user.type(screen.getByLabelText('职称'), '副教授')
    await user.click(screen.getByRole('button', { name: /保\s*存/ }))

    await screen.findByText('个人中心页')
    expect(mockedUpdateMyProfile).toHaveBeenCalledWith({
      departmentName: '软件学院',
      jobTitle: '副教授',
    })
    expect(useAuthStore.getState().user?.realName).toBe(updated.realName)
    expect(mockedMessage.success).toHaveBeenCalledWith('已保存')
  })

  it('shows backend error and keeps teacher profile input when save fails', async () => {
    const user = userEvent.setup()
    mockedGetMe.mockResolvedValue(createTeacherUser())
    mockedUpdateMyProfile.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { message: '部门不能为空' } } },
    })

    renderMeProfilePage()

    await user.clear(await screen.findByLabelText('部门'))
    await user.type(screen.getByLabelText('部门'), '外国语学院')
    await user.click(screen.getByRole('button', { name: /保\s*存/ }))

    await waitFor(() => {
      expect(mockedMessage.error).toHaveBeenCalledWith('部门不能为空')
    })
    expect(screen.queryByText('个人中心页')).not.toBeInTheDocument()
    expect(screen.getByLabelText('部门')).toHaveValue('外国语学院')
  })
})
