import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listMyPendingTasks } from '../../shared/api/pending-tasks'
import { fallbackPendingTasks } from '../../shared/mock/data'
import TasksPage from './TasksPage'

vi.mock('../../shared/api/pending-tasks', () => ({
  listMyPendingTasks: vi.fn(),
}))

const mockedListMyPendingTasks = vi.mocked(listMyPendingTasks)

function renderPage() {
  render(
    <MemoryRouter>
      <TasksPage />
    </MemoryRouter>
  )
}

describe('TasksPage', () => {
  beforeEach(() => {
    mockedListMyPendingTasks.mockReset()
    mockedListMyPendingTasks.mockResolvedValue(fallbackPendingTasks)
  })

  it('renders pending tasks from API and filters processed tasks', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('【立项审核】《2026 春季编程马拉松》一级审核')
    expect(screen.getByText('【报名审核】《校园开放日志愿服务》3 条待审')).toBeInTheDocument()

    await user.click(screen.getByText('已处理 (1)'))

    await waitFor(() => {
      expect(screen.getByText('【权限申请】organizer 角色申请')).toBeInTheDocument()
      expect(screen.queryByText('【报名审核】《校园开放日志愿服务》3 条待审')).not.toBeInTheDocument()
    })
    expect(mockedListMyPendingTasks).toHaveBeenCalled()
  })
})
