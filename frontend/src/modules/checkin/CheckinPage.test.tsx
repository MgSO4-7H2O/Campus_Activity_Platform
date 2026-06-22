import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createCheckinSession,
  getActivity,
  listCheckinRecords,
  listCheckinSessions,
} from '../../shared/api'
import type { CheckinSessionDto } from '../../shared/api/dto'
import CheckinPage from './CheckinPage'

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')
  return {
    ...actual,
    message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  }
})

vi.mock('../../shared/api', () => ({
  listCheckinSessions: vi.fn(),
  createCheckinSession: vi.fn(),
  openCheckinSession: vi.fn(),
  closeCheckinSession: vi.fn(),
  listCheckinRecords: vi.fn(),
  manualCheckin: vi.fn(),
  getActivity: vi.fn(),
}))

const mockedListSessions = vi.mocked(listCheckinSessions)
const mockedCreate = vi.mocked(createCheckinSession)
const mockedListRecords = vi.mocked(listCheckinRecords)
const mockedGetActivity = vi.mocked(getActivity)

function makeSession(over: Partial<CheckinSessionDto> = {}): CheckinSessionDto {
  return {
    id: 's1',
    activityId: 'act-001',
    title: 'Day 1 · 上午签到',
    method: 'CODE',
    code: '538291',
    startAt: '2026-05-25T01:00:00.000Z',
    endAt: '2026-05-25T03:00:00.000Z',
    status: 'OPEN',
    signedCount: 12,
    totalCount: 50,
    createdAt: '2026-05-25T00:00:00.000Z',
    ...over,
  }
}

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
  beforeEach(() => {
    mockedListSessions.mockReset()
    mockedCreate.mockReset()
    mockedListRecords.mockReset()
    mockedGetActivity.mockReset()
    mockedListRecords.mockResolvedValue([])
    mockedGetActivity.mockResolvedValue({ id: 'act-001', title: '春季编程马拉松' } as never)
  })

  it('从后端加载签到场次并展示签到码', async () => {
    mockedListSessions.mockResolvedValue([makeSession()])

    renderPage()

    expect(await screen.findByText('Day 1 · 上午签到')).toBeInTheDocument()
    expect(screen.getByText('538291')).toBeInTheDocument()
    expect(mockedListSessions).toHaveBeenCalledWith('act-001')
  })

  it('无场次时展示空状态', async () => {
    mockedListSessions.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('尚未创建任何签到场次')).toBeInTheDocument()
  })

  it('创建手动签到场次会调用后端并刷新列表', async () => {
    const user = userEvent.setup()
    mockedListSessions.mockResolvedValueOnce([])
    const created = makeSession({ id: 's2', title: '补签场次', method: 'MANUAL', code: null })
    mockedCreate.mockResolvedValue(created)
    mockedListSessions.mockResolvedValueOnce([created])

    renderPage()

    await screen.findByText('尚未创建任何签到场次')
    await user.click(screen.getByRole('button', { name: /创建签到场次/ }))
    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText('场次名称'), '补签场次')
    await user.click(within(dialog).getByText('手动签到'))
    await user.click(within(dialog).getByRole('button', { name: '确定创建' }))

    await waitFor(() =>
      expect(mockedCreate).toHaveBeenCalledWith(
        expect.objectContaining({ activityId: 'act-001', title: '补签场次', method: 'MANUAL' })
      )
    )
    expect(mockedListSessions).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('补签场次')).toBeInTheDocument()
  })
})
