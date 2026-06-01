import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import ClosureApplyPage from './ClosureApplyPage'

describe('ClosureApplyPage', () => {
  it('renders closure form and validates required summary length', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/activities/act-002/closure']}>
        <Routes>
          <Route path="/activities/:id/closure" element={<ClosureApplyPage />} />
        </Routes>
      </MemoryRouter>
    )

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
})
