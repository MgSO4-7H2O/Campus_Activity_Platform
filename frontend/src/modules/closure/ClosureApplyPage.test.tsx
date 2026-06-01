import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import ClosureApplyPage from './ClosureApplyPage'

function renderClosureApplyPage() {
  render(
    <MemoryRouter initialEntries={['/activities/act-002/closure']}>
      <Routes>
        <Route path="/activities/:id/closure" element={<ClosureApplyPage />} />
        <Route path="/my/activities" element={<div>我的活动页</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ClosureApplyPage', () => {
  it('renders closure form and validates required summary length', async () => {
    const user = userEvent.setup()

    renderClosureApplyPage()

    expect(screen.getByRole('heading', { name: '结项申请' })).toBeInTheDocument()
    expect(screen.getByText('校园歌手大赛决赛 · 提交结项材料')).toBeInTheDocument()
    expect(screen.getByLabelText('实际参与人数')).toBeInTheDocument()
    expect(screen.getByLabelText('活动总结')).toBeInTheDocument()
    expect(screen.getByText('上传现场照片、签到表、财务凭证等')).toBeInTheDocument()

    await user.type(screen.getByLabelText('实际参与人数'), '25')
    await user.type(screen.getByLabelText('活动总结'), '太短')
    await user.click(screen.getByRole('button', { name: /提交结项/ }))

    expect(await screen.findByText('至少 50 字')).toBeInTheDocument()
  })

  it('submits closure application and returns to my activities', async () => {
    const user = userEvent.setup()
    const summary = '本次活动按计划完成，现场组织有序，参与同学反馈良好，宣传、签到、现场执行和后勤保障均达到预期，后续将继续优化流程安排和物资准备。'

    renderClosureApplyPage()

    await user.type(screen.getByLabelText('实际参与人数'), '86')
    await user.type(screen.getByLabelText('实际支出'), '1200')
    await user.type(screen.getByLabelText('活动总结'), summary)
    await user.click(screen.getByRole('button', { name: /提交结项/ }))

    expect(await screen.findByText('我的活动页')).toBeInTheDocument()
  })
})
