import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listMyPendingTasks } from '../../shared/api/pending-tasks'
import type { PendingTaskDto } from '../../shared/api/dto'
import ReviewerInboxPage from './ReviewerInboxPage'

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')
  return {
    ...actual,
    message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  }
})

vi.mock('../../shared/api/pending-tasks', () => ({
  listMyPendingTasks: vi.fn(),
}))

const mockedList = vi.mocked(listMyPendingTasks)

function makeTask(over: Partial<PendingTaskDto> = {}): PendingTaskDto {
  return {
    id: 't1',
    ownerId: 'u1',
    title: '2026 春季编程马拉松',
    description: '计算机学院',
    status: 'PENDING',
    relatedResourceType: 'ACTIVITY_APPLICATION',
    relatedResourceId: 'app-001',
    link: null,
    createdAt: '2026-05-18T08:30:00.000Z',
    processedAt: null,
    ...over,
  }
}

function renderWithRoutes() {
  render(
    <MemoryRouter initialEntries={['/approvals']}>
      <Routes>
        <Route path="/approvals" element={<ReviewerInboxPage />} />
        <Route path="/approvals/:id" element={<div>审核详情页</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ReviewerInboxPage', () => {
  beforeEach(() => {
    mockedList.mockReset()
  })

  it('只展示活动立项类待办并支持按说明搜索', async () => {
    const user = userEvent.setup()
    mockedList.mockResolvedValue([
      makeTask(),
      makeTask({ id: 't2', title: '低年级英语角', description: '外国语学院', relatedResourceId: 'app-002' }),
      makeTask({
        id: 't3',
        title: '某权限申请',
        description: '不应出现',
        relatedResourceType: 'ROLE_APPLICATION',
        relatedResourceId: 'role-001',
      }),
    ])

    renderWithRoutes()

    expect(await screen.findByText('2026 春季编程马拉松')).toBeInTheDocument()
    expect(screen.getByText('低年级英语角')).toBeInTheDocument()
    // 非活动立项类待办被过滤掉
    expect(screen.queryByText('某权限申请')).not.toBeInTheDocument()
    expect(mockedList).toHaveBeenCalledWith({ status: 'PENDING' })

    await user.type(screen.getByPlaceholderText('搜索活动名称 / 说明'), '外国语学院')
    await user.keyboard('{Enter}')

    expect(screen.getByText('低年级英语角')).toBeInTheDocument()
    expect(screen.queryByText('2026 春季编程马拉松')).not.toBeInTheDocument()
  })

  it('点击立即审核进入对应申请的审核详情', async () => {
    const user = userEvent.setup()
    mockedList.mockResolvedValue([makeTask()])

    renderWithRoutes()

    await screen.findByText('2026 春季编程马拉松')
    await user.click(screen.getByRole('button', { name: '立即审核' }))

    expect(screen.getByText('审核详情页')).toBeInTheDocument()
  })
})
