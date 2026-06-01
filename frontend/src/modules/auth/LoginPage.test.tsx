import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { message } from 'antd'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { login } from '../../shared/api/auth'
import { getMe } from '../../shared/api/users'
import { useAuthStore } from '../../shared/auth/store'
import { createStudentUser } from '../../test/user-fixtures'
import LoginPage from './LoginPage'

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
  login: vi.fn(),
}))

vi.mock('../../shared/api/users', () => ({
  getMe: vi.fn(),
}))

const mockedLogin = vi.mocked(login)
const mockedGetMe = vi.mocked(getMe)
const mockedMessage = vi.mocked(message)

function renderLogin(initialPath: string, fromPath: string) {
  render(
    <MemoryRouter initialEntries={[{ pathname: initialPath, state: { from: { pathname: fromPath } } }]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/approvals" element={<div>审核待办页</div>} />
        <Route path="/me" element={<div>个人中心页</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockedLogin.mockReset()
    mockedGetMe.mockReset()
    mockedMessage.success.mockReset()
    mockedMessage.error.mockReset()
    useAuthStore.getState().logout()
  })

  it('logs in, stores session, fetches full user, and redirects to original route', async () => {
    const user = userEvent.setup()
    const sessionUser = createStudentUser({ studentProfile: null })
    const fullUser = createStudentUser()
    mockedLogin.mockResolvedValue({
      accessToken: 'access-token',
      user: sessionUser,
    })
    mockedGetMe.mockResolvedValue(fullUser)

    renderLogin('/login', '/approvals')

    await user.type(screen.getByLabelText('用户名'), 'student1')
    await user.type(screen.getByLabelText('密码'), 'Password123!')
    await user.click(screen.getByRole('button', { name: /登\s*录/ }))

    await screen.findByText('审核待办页')
    expect(mockedLogin).toHaveBeenCalledWith({
      username: 'student1',
      password: 'Password123!',
    })
    expect(mockedGetMe).toHaveBeenCalled()
    expect(useAuthStore.getState().accessToken).toBe('access-token')
    expect(useAuthStore.getState().user?.realName).toBe(fullUser.realName)
    expect(mockedMessage.success).toHaveBeenCalledWith('登录成功')
  })

  it('shows backend error message when login fails', async () => {
    const user = userEvent.setup()
    mockedLogin.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { message: '用户名或密码错误' } } },
    })

    renderLogin('/login', '/approvals')

    await user.type(screen.getByLabelText('用户名'), 'student1')
    await user.type(screen.getByLabelText('密码'), 'WrongPassword!')
    await user.click(screen.getByRole('button', { name: /登\s*录/ }))

    await waitFor(() => {
      expect(mockedMessage.error).toHaveBeenCalledWith('用户名或密码错误')
    })
    expect(screen.queryByText('审核待办页')).not.toBeInTheDocument()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })
})
