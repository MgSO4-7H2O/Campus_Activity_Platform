import { render, screen } from '../../__tests__/test-utils'
import { describe, expect, it, vi } from 'vitest'
import MyRegistrationsPage from './MyRegistrationsPage'

vi.mock('../../shared/api/signups', () => ({
  listMySignups: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
  cancelSignup: vi.fn(),
}))
vi.mock('../../shared/api/activities', () => ({
  listActivities: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
}))

describe('Recruitment pages', () => {
  it('renders my registrations page', async () => {
    render(<MyRegistrationsPage />)
    expect(screen.getByText('我的报名')).toBeInTheDocument()
  })
})
