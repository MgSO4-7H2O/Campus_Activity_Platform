import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { message } from 'antd'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createStudentUser } from '../../test/user-fixtures'
import { getMe, updateMe } from '../../shared/api/users'
import { useAuthStore } from '../../shared/auth/store'
import MeEditPage from './MeEditPage'

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
  updateMe: vi.fn(),
}))

const mockedGetMe = vi.mocked(getMe)
const mockedUpdateMe = vi.mocked(updateMe)
const mockedMessage = vi.mocked(message)

function renderMeEditPage() {
  render(
    <MemoryRouter initialEntries={['/me/edit']}>
      <Routes>
        <Route path="/me/edit" element={<MeEditPage />} />
        <Route path="/me" element={<div>个人中心页</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('MeEditPage', () => {
  beforeEach(() => {
    mockedGetMe.mockReset()
    mockedUpdateMe.mockReset()
    mockedMessage.success.mockReset()
    mockedMessage.error.mockReset()
    useAuthStore.getState().logout()
  })

  it('加载用户后渲染基础信息编辑字段', async () => {
    mockedGetMe.mockResolvedValue(createStudentUser())

    renderMeEditPage()

    expect(await screen.findByLabelText('真实姓名')).toBeInTheDocument()
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
    expect(screen.getByLabelText('手机号')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /保\s*存/ })).toBeInTheDocument()
  })

  it('saves base profile, updates auth store, and redirects to profile page', async () => {
    const user = userEvent.setup()
    const original = createStudentUser()
    const updated = createStudentUser({
      realName: '新姓名',
      email: 'new-student@example.com',
      phone: '13900000000',
    })
    mockedGetMe.mockResolvedValue(original)
    mockedUpdateMe.mockResolvedValue(updated)

    renderMeEditPage()

    await user.clear(await screen.findByLabelText('真实姓名'))
    await user.type(screen.getByLabelText('真实姓名'), '新姓名')
    await user.clear(screen.getByLabelText('邮箱'))
    await user.type(screen.getByLabelText('邮箱'), 'new-student@example.com')
    await user.clear(screen.getByLabelText('手机号'))
    await user.type(screen.getByLabelText('手机号'), '13900000000')
    await user.click(screen.getByRole('button', { name: /保\s*存/ }))

    await screen.findByText('个人中心页')
    expect(mockedUpdateMe).toHaveBeenCalledWith({
      realName: '新姓名',
      email: 'new-student@example.com',
      phone: '13900000000',
    })
    expect(useAuthStore.getState().user?.realName).toBe('新姓名')
    expect(mockedMessage.success).toHaveBeenCalledWith('已保存')
  })

  it('shows backend error and keeps form input when base profile save fails', async () => {
    const user = userEvent.setup()
    mockedGetMe.mockResolvedValue(createStudentUser())
    mockedUpdateMe.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { message: '邮箱已被使用' } } },
    })

    renderMeEditPage()

    await user.clear(await screen.findByLabelText('邮箱'))
    await user.type(screen.getByLabelText('邮箱'), 'used@example.com')
    await user.click(screen.getByRole('button', { name: /保\s*存/ }))

    await waitFor(() => {
      expect(mockedMessage.error).toHaveBeenCalledWith('邮箱已被使用')
    })
    expect(screen.queryByText('个人中心页')).not.toBeInTheDocument()
    expect(screen.getByLabelText('邮箱')).toHaveValue('used@example.com')
  })
})
