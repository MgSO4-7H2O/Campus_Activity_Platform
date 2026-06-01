import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import CheckinPage from './CheckinPage'

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/activities/act-001/checkin']}>
      <Routes>
        <Route path="/activities/:id/checkin" element={<CheckinPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CheckinPage', () => {
  it('renders existing sessions and creates a new manual session', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByText('活动签到')).toBeInTheDocument()
    expect(screen.getByText('Day 1 · 上午签到')).toBeInTheDocument()
    expect(screen.getByText('538291')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /创建签到场次/ }))
    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText('场次名称'), '补签场次')
    await user.click(within(dialog).getByText('手动签到'))
    await user.click(within(dialog).getByRole('button', { name: '确定创建' }))

    expect(await screen.findByText('补签场次')).toBeInTheDocument()
    expect(screen.getAllByText('手动签到').length).toBeGreaterThan(0)
  })
})
