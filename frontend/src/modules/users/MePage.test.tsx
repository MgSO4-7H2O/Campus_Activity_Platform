import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMe } from '../../shared/api/users'
import { useAuthStore } from '../../shared/auth/store'
import { createStudentUser } from '../../test/user-fixtures'
import MePage from './MePage'

vi.mock('../../shared/api/users', () => ({
  getMe: vi.fn(),
}))

const mockedGetMe = vi.mocked(getMe)

describe('MePage', () => {
  beforeEach(() => {
    mockedGetMe.mockReset()
    useAuthStore.getState().logout()
  })

  it('loads and displays account plus student profile information', async () => {
    mockedGetMe.mockResolvedValue(
      createStudentUser({
        roles: ['BASIC_USER', 'ORGANIZER'],
      })
    )

    render(
      <MemoryRouter>
        <MePage />
      </MemoryRouter>
    )

    expect(await screen.findByText('student1')).toBeInTheDocument()
    expect(screen.getByText('测试学生')).toBeInTheDocument()
    expect(screen.getByText('普通用户')).toBeInTheDocument()
    expect(screen.getByText('活动负责人')).toBeInTheDocument()
    expect(screen.getByText('计算机学院')).toBeInTheDocument()
    expect(screen.getByText('软件工程')).toBeInTheDocument()
  })

  it('refreshes current user data and shows empty profile state', async () => {
    const user = userEvent.setup()
    mockedGetMe.mockResolvedValue(createStudentUser({ studentProfile: null }))

    render(
      <MemoryRouter>
        <MePage />
      </MemoryRouter>
    )

    expect(await screen.findByText('尚未填写')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /刷新/ }))

    expect(mockedGetMe).toHaveBeenCalledTimes(2)
  })
})
