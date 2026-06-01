import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listAdminUsers } from '../../shared/api/admin'
import { fallbackAdminUsers } from '../../shared/mock/data'
import AdminUsersPage from './AdminUsersPage'

vi.mock('../../shared/api/admin', () => ({
  listAdminUsers: vi.fn(),
  setAdminUserStatus: vi.fn(),
}))

const mockedListAdminUsers = vi.mocked(listAdminUsers)

function renderPage() {
  render(
    <MemoryRouter>
      <AdminUsersPage />
    </MemoryRouter>
  )
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    mockedListAdminUsers.mockReset()
    mockedListAdminUsers.mockResolvedValue({
      items: fallbackAdminUsers,
      total: fallbackAdminUsers.length,
      page: 1,
      pageSize: 100,
    })
  })

  it('renders admin users from API and filters by keyword', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('student1')
    expect(screen.getByText('organizer1')).toBeInTheDocument()
    expect(screen.getByText('reviewer1')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('按用户名/姓名/邮箱搜索'), 'reviewer1{Enter}')

    await waitFor(() => {
      expect(screen.getByText('reviewer1')).toBeInTheDocument()
      expect(screen.queryByText('student1')).not.toBeInTheDocument()
    })
    expect(mockedListAdminUsers).toHaveBeenCalledWith({ pageSize: 100 })
  })
})
