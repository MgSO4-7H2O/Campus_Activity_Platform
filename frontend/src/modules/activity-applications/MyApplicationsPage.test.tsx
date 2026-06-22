import { render, screen } from '../../__tests__/test-utils'
import { describe, expect, it, vi } from 'vitest'
import MyApplicationsPage from './MyApplicationsPage'

vi.mock('../../shared/api/activity-applications', () => ({
  listMyActivityApplications: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
}))

describe('MyApplicationsPage', () => {
  it('renders the page title', async () => {
    render(<MyApplicationsPage />)
    expect(screen.getByText('我的申请')).toBeInTheDocument()
  })
})
