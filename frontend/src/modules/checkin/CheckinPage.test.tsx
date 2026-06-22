import { render, screen } from '../../__tests__/test-utils'
import { describe, expect, it, vi } from 'vitest'
import CheckinPage from './CheckinPage'

vi.mock('../../shared/api/checkin', () => ({
  listCheckinSessions: vi.fn().mockResolvedValue([]),
  listCheckinRecords: vi.fn().mockResolvedValue([]),
  createCheckinSession: vi.fn(),
  openCheckinSession: vi.fn(),
  closeCheckinSession: vi.fn(),
  performCheckin: vi.fn(),
  manualCheckin: vi.fn(),
}))
vi.mock('../../shared/api/activities', () => ({
  getActivity: vi.fn().mockResolvedValue(null),
}))

describe('CheckinPage', () => {
  it('renders checkin page', async () => {
    render(<CheckinPage />)
    expect(screen.getByText('活动签到')).toBeInTheDocument()
  })
})
