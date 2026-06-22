import { render, screen } from '../../__tests__/test-utils'
import { describe, expect, it, vi } from 'vitest'
import NotificationCenterPage from './NotificationCenterPage'

vi.mock('../../shared/api/notifications', () => ({
  listNotifications: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
  getUnreadCount: vi.fn().mockResolvedValue(0),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}))

describe('NotificationCenterPage', () => {
  it('renders notification center page', async () => {
    render(<NotificationCenterPage />)
    expect(screen.getByText('通知中心')).toBeInTheDocument()
  })
})
