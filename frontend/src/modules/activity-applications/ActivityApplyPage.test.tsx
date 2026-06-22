import { render, screen } from '../../__tests__/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ActivityApplyPage from './ActivityApplyPage'

vi.mock('../../shared/api/activity-applications', () => ({
  createActivityApplication: vi.fn(),
  submitActivityApplication: vi.fn(),
  uploadApplicationAttachment: vi.fn(),
}))
vi.mock('../../shared/api/organizations', () => ({
  listOrganizations: vi.fn().mockResolvedValue([]),
}))

describe('ActivityApplyPage', () => {
  it('renders the application form', async () => {
    render(<ActivityApplyPage />)
    expect(screen.getByText('活动立项申请')).toBeInTheDocument()
    expect(screen.getByText('保存草稿')).toBeInTheDocument()
    expect(screen.getByText('提交申请')).toBeInTheDocument()
  })
})
