import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import RegisterPage from './RegisterPage'

vi.mock('../../shared/api/auth', () => ({
  register: vi.fn(),
}))

vi.mock('../../shared/api/users', () => ({
  getMe: vi.fn(),
}))

describe('RegisterPage', () => {
  it('渲染注册表单字段', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

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
})
