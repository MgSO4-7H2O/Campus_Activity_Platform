import { render, screen } from '../../__tests__/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AppLayout from './AppLayout'

vi.mock('../../shared/api/notifications', () => ({
  listNotifications: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
  getUnreadCount: vi.fn().mockResolvedValue(0),
}))

describe('AppLayout', () => {
  it('renders app layout with navigation', async () => {
    render(<AppLayout />)
    expect(screen.getByText('首页')).toBeInTheDocument()
  })
})
