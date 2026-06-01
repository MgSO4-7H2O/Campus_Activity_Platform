import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import NotificationCenterPage from './NotificationCenterPage'

function renderPage() {
  render(
    <MemoryRouter>
      <NotificationCenterPage />
    </MemoryRouter>
  )
}

describe('NotificationCenterPage', () => {
  it('filters unread notifications and marks one notification as read', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByText('通知中心')).toBeInTheDocument()
    expect(screen.getByText('未读 (2)')).toBeInTheDocument()

    await user.click(screen.getByText('未读 (2)'))

    expect(screen.getByText('【立项审核】《2026 春季编程马拉松》一级审核通过')).toBeInTheDocument()
    expect(screen.queryByText('【系统】平台将于本周日凌晨进行例行维护')).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '标为已读' })[0])

    await waitFor(() => {
      expect(screen.getByText('未读 (1)')).toBeInTheDocument()
    })
  })

  it('marks all notifications as read', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /全部标为已读/ }))

    await waitFor(() => {
      expect(screen.getByText('未读 (0)')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /全部标为已读/ })).toBeDisabled()
  })
})
