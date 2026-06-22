import { render, screen } from '../../__tests__/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ReviewerInboxPage from './ReviewerInboxPage'

vi.mock('../../shared/api/pending-tasks', () => ({
  listMyPendingTasks: vi.fn().mockResolvedValue([]),
}))

describe('ReviewerInboxPage', () => {
  it('renders reviewer inbox page', async () => {
    render(<ReviewerInboxPage />)
    expect(screen.getByText('立项审核待办')).toBeInTheDocument()
  })
})
