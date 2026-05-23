import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import ReviewerInboxPage from './ReviewerInboxPage'

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
  it('渲染审核待办并支持按组织搜索', async () => {
    const user = userEvent.setup()
    renderWithRoutes()

    expect(screen.getByText('立项审核待办')).toBeInTheDocument()
    expect(screen.getByText('2026 春季编程马拉松')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('搜索活动名称 / 组织'), '外国语学院')
    await user.keyboard('{Enter}')

    expect(screen.getByText('低年级英语角')).toBeInTheDocument()
    expect(screen.queryByText('2026 春季编程马拉松')).not.toBeInTheDocument()
  })

  it('点击立即审核进入对应审核详情路由', async () => {
    const user = userEvent.setup()
    renderWithRoutes()

    await user.click(screen.getAllByRole('button', { name: '立即审核' })[0])

    expect(screen.getByText('审核详情页')).toBeInTheDocument()
  })
})
