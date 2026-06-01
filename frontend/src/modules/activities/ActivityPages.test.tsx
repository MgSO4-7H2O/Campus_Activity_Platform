import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import ActivityDetailPage from './ActivityDetailPage'
import ActivityListPage from './ActivityListPage'

describe('Activity pages', () => {
  it('filters activity list by status and keyword', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <ActivityListPage />
      </MemoryRouter>
    )

    expect(screen.getByText('2026 春季编程马拉松')).toBeInTheDocument()
    expect(screen.getByText('校园歌手大赛决赛')).toBeInTheDocument()
    expect(screen.getByText('红十字应急救护培训')).toBeInTheDocument()

    await user.click(screen.getByTitle('招募中'))

    expect(screen.getByText('2026 春季编程马拉松')).toBeInTheDocument()
    expect(screen.queryByText('校园歌手大赛决赛')).not.toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('搜索活动'), '不存在的活动')
    await user.keyboard('{Enter}')

    expect(screen.getByText('暂无活动')).toBeInTheDocument()
  })

  it('renders activity detail with recruitment entry and missing activity state', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/activities/act-001']}>
        <Routes>
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('2026 春季编程马拉松')).toBeInTheDocument()
    expect(screen.getByText('计算机科学与技术学院')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '立即报名' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /签\s*到/ })).toBeInTheDocument()

    unmount()

    render(
      <MemoryRouter initialEntries={['/activities/missing']}>
        <Routes>
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('未找到该活动')).toBeInTheDocument()
  })
})
