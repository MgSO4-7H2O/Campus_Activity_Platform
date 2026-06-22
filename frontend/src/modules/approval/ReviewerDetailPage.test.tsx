import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getReviewerApplication,
  listApprovalRecords,
  reviewActivityApplication,
} from '../../shared/api/activity-applications'
import type { ActivityApplicationDto, ApprovalRecordDto } from '../../shared/api/dto'
import ReviewerDetailPage from './ReviewerDetailPage'

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')
  return {
    ...actual,
    message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  }
})

vi.mock('../../shared/api/activity-applications', () => ({
  getReviewerApplication: vi.fn(),
  listApprovalRecords: vi.fn(),
  reviewActivityApplication: vi.fn(),
}))

const mockedGet = vi.mocked(getReviewerApplication)
const mockedRecords = vi.mocked(listApprovalRecords)
const mockedReview = vi.mocked(reviewActivityApplication)

function makeApp(over: Partial<ActivityApplicationDto> = {}): ActivityApplicationDto {
  return {
    id: 'app-001',
    title: '2026 春季编程马拉松',
    organizationId: 'org-1',
    organizationName: '计算机协会',
    organizerId: 'u-1',
    organizerName: '王宇晗',
    status: 'APPROVING',
    brief: '面向全校的算法竞赛',
    expectedStart: '2026-05-20',
    expectedEnd: '2026-05-22',
    expectedScale: 200,
    budget: 8000,
    location: '主楼报告厅',
    submittedAt: '2026-05-18T08:30:00.000Z',
    currentApprovalLevel: 1,
    attachments: [
      {
        id: 'att-1',
        applicationId: 'app-001',
        fileName: '活动方案.pdf',
        fileSize: 1258291,
        fileUrl: '/uploads/plan.pdf',
        mimeType: 'application/pdf',
        uploadedAt: '2026-05-18T08:30:00.000Z',
      },
    ],
    createdAt: '2026-05-18T08:00:00.000Z',
    updatedAt: '2026-05-18T08:30:00.000Z',
    ...over,
  }
}

function makeRecord(over: Partial<ApprovalRecordDto> = {}): ApprovalRecordDto {
  return {
    id: 'rec-1',
    applicationId: 'app-001',
    level: 1,
    reviewerId: 'r-1',
    reviewerName: '李老师',
    organizationId: 'org-1',
    decision: 'APPROVE',
    comment: '材料齐全',
    decidedAt: '2026-05-18T09:00:00.000Z',
    ...over,
  }
}

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
  beforeEach(() => {
    mockedGet.mockReset()
    mockedRecords.mockReset()
    mockedReview.mockReset()
    mockedReview.mockResolvedValue(makeApp())
  })

  it('从后端加载并展示申请详情、附件和审核历史', async () => {
    mockedGet.mockResolvedValue(makeApp())
    mockedRecords.mockResolvedValue([makeRecord()])

    renderDetail('/approvals/app-001')

    expect(await screen.findByRole('heading', { name: '审核详情' })).toBeInTheDocument()
    expect(screen.getAllByText('2026 春季编程马拉松').length).toBeGreaterThan(0)
    expect(screen.getByText(/活动方案\.pdf/)).toBeInTheDocument()
    expect(screen.getByText(/1\.2 MB/)).toBeInTheDocument()
    expect(screen.getByText('第 1 级 · 李老师')).toBeInTheDocument()
    expect(mockedGet).toHaveBeenCalledWith('app-001')
  })

  it('缺少审核意见时阻止直接通过', async () => {
    mockedGet.mockResolvedValue(makeApp())
    mockedRecords.mockResolvedValue([])
    const user = userEvent.setup()

    renderDetail('/approvals/app-001')
    await screen.findByRole('heading', { name: '审核详情' })

    await user.click(screen.getByRole('button', { name: /通过/ }))

    expect(screen.queryByText('确认通过该申请？')).not.toBeInTheDocument()
    expect(mockedReview).not.toHaveBeenCalled()
  })

  it('填写审核意见后打开通过确认弹窗', async () => {
    mockedGet.mockResolvedValue(makeApp())
    mockedRecords.mockResolvedValue([])
    const user = userEvent.setup()

    renderDetail('/approvals/app-001')
    await screen.findByRole('heading', { name: '审核详情' })

    await user.type(
      screen.getByPlaceholderText('请填写审核意见（驳回 / 要求补材料时为必填）'),
      '材料完整，同意通过。'
    )
    await user.click(screen.getByRole('button', { name: /通过/ }))

    expect(screen.getByText('确认通过该申请？')).toBeInTheDocument()
  })

  it('填写审核意见后可以驳回并提交到后端', async () => {
    mockedGet.mockResolvedValue(makeApp())
    mockedRecords.mockResolvedValue([])
    const user = userEvent.setup()

    renderDetail('/approvals/app-001')
    await screen.findByRole('heading', { name: '审核详情' })

    await user.type(
      screen.getByPlaceholderText('请填写审核意见（驳回 / 要求补材料时为必填）'),
      '预算依据不足，驳回。'
    )
    await user.click(screen.getByRole('button', { name: /驳回/ }))

    expect(screen.getByText('确认驳回该申请？')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'OK' }))

    await waitFor(() =>
      expect(mockedReview).toHaveBeenCalledWith('app-001', {
        decision: 'REJECT',
        comment: '预算依据不足，驳回。',
      })
    )
    expect(await screen.findByText('审核待办页')).toBeInTheDocument()
  })

  it('找不到申请时展示空状态', async () => {
    mockedGet.mockRejectedValue(new Error('not found'))
    mockedRecords.mockResolvedValue([])

    renderDetail('/approvals/missing-application')

    expect(await screen.findByText('未找到该申请')).toBeInTheDocument()
  })
})
