import { render, screen } from '../../__tests__/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AdminOrganizationsPage from './AdminOrganizationsPage'

vi.mock('../../shared/api/organizations', () => ({
  getOrganizationTree: vi.fn().mockResolvedValue([]),
  createOrganization: vi.fn(),
  updateOrganization: vi.fn(),
}))

describe('AdminOrganizationsPage', () => {
  it('renders admin organizations page', async () => {
    render(<AdminOrganizationsPage />)
    expect(screen.getByText('组织管理')).toBeInTheDocument()
  })
})
