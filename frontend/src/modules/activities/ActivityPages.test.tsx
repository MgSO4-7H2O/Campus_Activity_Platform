import { render, screen } from '../../__tests__/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ActivityListPage from './ActivityListPage'

vi.mock('../../shared/api/activities', () => ({
  listActivities: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
  listMyActivities: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
  getActivity: vi.fn().mockResolvedValue(null),
}))

describe('Activity pages', () => {
  it('renders activity list page', async () => {
    render(<ActivityListPage />)
    expect(screen.getByText('活动列表')).toBeInTheDocument()
  })
})
