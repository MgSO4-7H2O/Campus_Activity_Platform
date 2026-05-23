import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import MyApplicationsPage from './MyApplicationsPage'

describe('MyApplicationsPage', () => {
  it('渲染申请列表并支持按活动名称搜索', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <MyApplicationsPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: '我的申请' })).toBeInTheDocument()
    expect(screen.getByText('2026 春季编程马拉松')).toBeInTheDocument()
    expect(screen.getByText('人工智能前沿讲座')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('搜索活动名称'), '校园开放日')
    await user.keyboard('{Enter}')

    expect(screen.getByText('校园开放日志愿服务')).toBeInTheDocument()
    expect(screen.queryByText('2026 春季编程马拉松')).not.toBeInTheDocument()
  })

  it('切换进行中筛选时保留待补材料和草稿申请', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <MyApplicationsPage />
      </MemoryRouter>
    )

    await user.click(screen.getByText('进行中'))

    expect(screen.getByText('人工智能前沿讲座')).toBeInTheDocument()
    expect(screen.getByText('校园开放日志愿服务')).toBeInTheDocument()
    expect(screen.getByText('待补材料')).toBeInTheDocument()
    expect(screen.getByText('草稿')).toBeInTheDocument()
  })
})
