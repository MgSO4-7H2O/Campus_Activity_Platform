import { render, screen } from '../../__tests__/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ReviewerDetailPage from './ReviewerDetailPage'

vi.mock('../../shared/api/activity-applications', () => ({
  getReviewerApplication: vi.fn().mockResolvedValue(null),
  listApprovalRecords: vi.fn().mockResolvedValue([]),
  reviewActivityApplication: vi.fn(),
}))

describe('ReviewerDetailPage', () => {
  it('shows empty state when application not found', async () => {
    render(<ReviewerDetailPage />)
    expect(screen.getByText('未找到该申请')).toBeInTheDocument()
  })
})
