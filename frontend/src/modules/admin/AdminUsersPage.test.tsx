import { render, screen } from '../../__tests__/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AdminUsersPage from './AdminUsersPage'

vi.mock('../../shared/api/admin', () => ({
  listAdminUsers: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
  setAdminUserStatus: vi.fn(),
}))

describe('AdminUsersPage', () => {
  it('renders admin users page', async () => {
    render(<AdminUsersPage />)
    expect(screen.getByText('用户管理')).toBeInTheDocument()
  })
})
