import { render, screen } from '../../__tests__/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ClosureApplyPage from './ClosureApplyPage'

vi.mock('../../shared/api/closures', () => ({
  createClosureApplication: vi.fn(),
  submitClosureApplication: vi.fn(),
  listMyClosureApplications: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
}))
vi.mock('../../shared/api/activities', () => ({
  listMyActivities: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
}))

describe('ClosureApplyPage', () => {
  it('renders closure apply page', async () => {
    render(<ClosureApplyPage />)
    expect(screen.getByText('结项申请')).toBeInTheDocument()
  })
})
