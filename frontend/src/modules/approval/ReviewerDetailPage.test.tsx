import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import ReviewerDetailPage from './ReviewerDetailPage'

function renderDetail(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/approvals" element={<div>审核待办页</div>} />
        <Route path="/approvals/:id" element={<ReviewerDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ReviewerDetailPage', () => {
  it('展示申请详情、附件和审核历史', () => {
    renderDetail('/approvals/app-001')

    expect(screen.getByRole('heading', { name: '审核详情' })).toBeInTheDocument()
    expect(screen.getAllByText('2026 春季编程马拉松').length).toBeGreaterThan(0)
    expect(screen.getByText(/活动方案\.pdf/)).toBeInTheDocument()
    expect(screen.getByText(/1\.2 MB/)).toBeInTheDocument()
    expect(screen.getByText('第 1 级 · 李老师')).toBeInTheDocument()
  })

  it('缺少审核意见时阻止直接通过', async () => {
    const user = userEvent.setup()
    renderDetail('/approvals/app-001')

    await user.click(screen.getByRole('button', { name: /通过/ }))

    expect(screen.queryByText('确认通过该申请？')).not.toBeInTheDocument()
  })

  it('填写审核意见后打开通过确认弹窗', async () => {
    const user = userEvent.setup()
    renderDetail('/approvals/app-001')

    await user.type(screen.getByPlaceholderText('请填写审核意见（驳回 / 要求补材料时为必填）'), '材料完整，同意通过。')
    await user.click(screen.getByRole('button', { name: /通过/ }))

    expect(screen.getByText('确认通过该申请？')).toBeInTheDocument()
    expect(screen.getAllByText('材料完整，同意通过。').length).toBeGreaterThan(1)
  })

  it('填写审核意见后可以驳回申请并返回待办页', async () => {
    const user = userEvent.setup()
    renderDetail('/approvals/app-001')

    await user.type(screen.getByPlaceholderText('请填写审核意见（驳回 / 要求补材料时为必填）'), '预算依据不足，驳回。')
    await user.click(screen.getByRole('button', { name: /驳回/ }))

    expect(screen.getByText('确认驳回该申请？')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(await screen.findByText('审核待办页')).toBeInTheDocument()
  })

  it('填写审核意见后可以要求补材料并返回待办页', async () => {
    const user = userEvent.setup()
    renderDetail('/approvals/app-001')

    await user.type(screen.getByPlaceholderText('请填写审核意见（驳回 / 要求补材料时为必填）'), '请补充安全预案和场地审批证明。')
    await user.click(screen.getByRole('button', { name: /要求补材料/ }))

    expect(screen.getByText('确认要求补材料该申请？')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(await screen.findByText('审核待办页')).toBeInTheDocument()
  })

  it('找不到申请时展示空状态', () => {
    renderDetail('/approvals/missing-application')

    expect(screen.getByText('未找到该申请')).toBeInTheDocument()
  })
})
