import { render, screen } from '../../__tests__/test-utils'
import { describe, expect, it, vi } from 'vitest'
import TasksPage from './TasksPage'

vi.mock('../../shared/api/pending-tasks', () => ({
  listMyPendingTasks: vi.fn().mockResolvedValue([]),
  processPendingTask: vi.fn(),
}))

describe('TasksPage', () => {
  it('renders pending tasks page', async () => {
    render(<TasksPage />)
    expect(screen.getByText('我的待办')).toBeInTheDocument()
  })
})
