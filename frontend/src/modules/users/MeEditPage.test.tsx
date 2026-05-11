import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createStudentUser } from '../../test/user-fixtures'
import { getMe, updateMe } from '../../shared/api/users'
import MeEditPage from './MeEditPage'

vi.mock('../../shared/api/users', () => ({
  getMe: vi.fn(),
  updateMe: vi.fn(),
}))

const mockedGetMe = vi.mocked(getMe)
const mockedUpdateMe = vi.mocked(updateMe)

describe('MeEditPage', () => {
  beforeEach(() => {
    mockedGetMe.mockReset()
    mockedUpdateMe.mockReset()
  })

  it('加载用户后渲染基础信息编辑字段', async () => {
    mockedGetMe.mockResolvedValue(createStudentUser())

    render(
      <MemoryRouter>
        <MeEditPage />
      </MemoryRouter>
    )

    expect(await screen.findByLabelText('真实姓名')).toBeInTheDocument()
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
    expect(screen.getByLabelText('手机号')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /保\s*存/ })).toBeInTheDocument()
  })
})
