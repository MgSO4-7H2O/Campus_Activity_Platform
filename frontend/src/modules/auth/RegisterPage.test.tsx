import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { message } from 'antd'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { register } from '../../shared/api/auth'
import { getMe } from '../../shared/api/users'
import { useAuthStore } from '../../shared/auth/store'
import { createStudentUser } from '../../test/user-fixtures'
import RegisterPage from './RegisterPage'

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

vi.mock('../../shared/api/auth', () => ({
  register: vi.fn(),
}))

vi.mock('../../shared/api/users', () => ({
  getMe: vi.fn(),
}))

const mockedRegister = vi.mocked(register)
const mockedGetMe = vi.mocked(getMe)
const mockedMessage = vi.mocked(message)

function renderRegister() {
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/me/profile" element={<div>资料完善页</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    mockedRegister.mockReset()
    mockedGetMe.mockReset()
    mockedMessage.success.mockReset()
    mockedMessage.error.mockReset()
    useAuthStore.getState().logout()
  })

  it('渲染注册表单字段', () => {
    renderRegister()

    expect(screen.getByText('注册新账号')).toBeInTheDocument()
    expect(screen.getByLabelText('用户名')).toBeInTheDocument()
    expect(screen.getByLabelText('密码')).toBeInTheDocument()
    expect(screen.getByLabelText('真实姓名')).toBeInTheDocument()
    expect(screen.getByText('用户类型')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '学生' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '教师' })).toBeInTheDocument()
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
    expect(screen.getByLabelText('手机号')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '注册并登录' })).toBeInTheDocument()
  })

  it('submits registration, stores session, fetches profile, and redirects', async () => {
    const user = userEvent.setup()
    const sessionUser = createStudentUser({ studentProfile: null })
    const fullUser = createStudentUser()
    mockedRegister.mockResolvedValue({
      accessToken: 'register-token',
      user: sessionUser,
    })
    mockedGetMe.mockResolvedValue(fullUser)

    renderRegister()

    await user.type(screen.getByLabelText('用户名'), 'newstudent')
    await user.type(screen.getByLabelText('密码'), 'Password123!')
    await user.type(screen.getByLabelText('真实姓名'), '新学生')
    await user.type(screen.getByLabelText('邮箱'), 'newstudent@example.com')
    await user.type(screen.getByLabelText('手机号'), '13800000009')
    await user.click(screen.getByRole('button', { name: '注册并登录' }))

    await screen.findByText('资料完善页')
    expect(mockedRegister).toHaveBeenCalledWith({
      username: 'newstudent',
      password: 'Password123!',
      realName: '新学生',
      userType: 'student',
      email: 'newstudent@example.com',
      phone: '13800000009',
    })
    expect(mockedGetMe).toHaveBeenCalled()
    expect(useAuthStore.getState().accessToken).toBe('register-token')
    expect(useAuthStore.getState().user?.realName).toBe(fullUser.realName)
    expect(mockedMessage.success).toHaveBeenCalledWith('注册成功，已自动登录')
  })

  it('shows backend error message when registration fails', async () => {
    const user = userEvent.setup()
    mockedRegister.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { message: '用户名已存在' } } },
    })

    renderRegister()

    await user.type(screen.getByLabelText('用户名'), 'existing')
    await user.type(screen.getByLabelText('密码'), 'Password123!')
    await user.type(screen.getByLabelText('真实姓名'), '重复用户')
    await user.click(screen.getByRole('button', { name: '注册并登录' }))

    await waitFor(() => {
      expect(mockedMessage.error).toHaveBeenCalledWith('用户名已存在')
    })
    expect(screen.queryByText('资料完善页')).not.toBeInTheDocument()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })
})
