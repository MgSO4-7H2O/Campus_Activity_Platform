import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { message } from 'antd'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createActivityApplication,
  submitActivityApplication,
} from '../../shared/api/activity-applications'
import type { ActivityApplicationDto, OrganizationDto } from '../../shared/api/dto'
import { listOrganizations } from '../../shared/api/organizations'
import ActivityApplyPage from './ActivityApplyPage'

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  type TestSelectOption = { value: string; label: ReactNode }
  type TestSelectProps = {
    id?: string
    value?: string
    placeholder?: string
    options?: TestSelectOption[]
    onChange?: (value: string) => void
  }
  type TestRangePickerProps = {
    value?: [string, string]
    onChange?: (value: [string, string]) => void
  }

  function TestSelect({ id, value, placeholder, options, onChange }: TestSelectProps) {
    return (
      <select id={id} value={value ?? ''} onChange={(event) => onChange?.(event.currentTarget.value)}>
        <option value="">{placeholder}</option>
        {(options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  function TestRangePicker({ value, onChange }: TestRangePickerProps) {
    return (
      <>
        <input
          aria-label="活动开始时间"
          value={value?.[0] ?? ''}
          onChange={(event) => onChange?.([event.currentTarget.value, value?.[1] ?? ''])}
        />
        <input
          aria-label="活动结束时间"
          value={value?.[1] ?? ''}
          onChange={(event) => onChange?.([value?.[0] ?? '', event.currentTarget.value])}
        />
      </>
    )
  }

  return {
    ...actual,
    DatePicker: {
      ...actual.DatePicker,
      RangePicker: TestRangePicker,
    },
    Select: TestSelect,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }
})

vi.mock('../../shared/api/activity-applications', () => ({
  createActivityApplication: vi.fn(),
  submitActivityApplication: vi.fn(),
}))

vi.mock('../../shared/api/organizations', () => ({
  listOrganizations: vi.fn(),
}))

const mockedCreateActivityApplication = vi.mocked(createActivityApplication)
const mockedSubmitActivityApplication = vi.mocked(submitActivityApplication)
const mockedListOrganizations = vi.mocked(listOrganizations)
const mockedMessage = vi.mocked(message)

const organization: OrganizationDto = {
  id: '11111111-1111-4111-8111-111111111111',
  name: '软件工程协会',
  type: 'club',
  parentOrgId: null,
  status: 'ACTIVE',
  description: null,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
}

const application: ActivityApplicationDto = {
  id: '22222222-2222-4222-8222-222222222222',
  title: '校园技术开放日',
  organizationId: organization.id,
  organizationName: organization.name,
  organizerId: '33333333-3333-4333-8333-333333333333',
  organizerName: '负责人',
  status: 'DRAFT',
  brief: '活动简介',
  expectedStart: '2026-06-10T09:00:00.000Z',
  expectedEnd: '2026-06-10T12:00:00.000Z',
  expectedScale: 80,
  budget: 1200,
  location: '紫金港校区',
  submittedAt: null,
  currentApprovalLevel: 0,
  attachments: [],
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
}
const validBrief = '面向全校学生展示技术项目成果并组织交流工作坊，包含项目演示、经验分享和现场答疑环节'
const validPlan = '上午进行项目展示和嘉宾分享，下午组织分组交流、报名答疑和安全巡检安排，并由负责人完成现场秩序维护和突发情况记录'

function renderActivityApplyPage() {
  render(
    <MemoryRouter initialEntries={['/applications/new']}>
      <Routes>
        <Route path="/applications/new" element={<ActivityApplyPage />} />
        <Route path="/applications" element={<div>我的申请页</div>} />
      </Routes>
    </MemoryRouter>
  )
}

async function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('活动名称'), { target: { value: '校园技术开放日' } })
  fireEvent.change(await screen.findByLabelText('发起组织'), { target: { value: organization.id } })
  fireEvent.change(screen.getByLabelText('活动类别'), { target: { value: 'academic' } })
  fireEvent.change(screen.getByLabelText('活动开始时间'), {
    target: { value: '2026-06-10T09:00:00.000Z' },
  })
  fireEvent.change(screen.getByLabelText('活动结束时间'), {
    target: { value: '2026-06-10T12:00:00.000Z' },
  })
  fireEvent.change(screen.getByLabelText('活动地点'), { target: { value: '紫金港校区图书馆 B201' } })
  fireEvent.change(screen.getByLabelText('预计规模'), { target: { value: '80' } })
  fireEvent.change(screen.getByLabelText('预算'), { target: { value: '1200' } })
  fireEvent.change(screen.getByLabelText('活动简介'), { target: { value: validBrief } })
  fireEvent.change(screen.getByLabelText('活动方案'), { target: { value: validPlan } })
}

describe('ActivityApplyPage', () => {
  beforeEach(() => {
    mockedCreateActivityApplication.mockReset()
    mockedSubmitActivityApplication.mockReset()
    mockedListOrganizations.mockReset()
    mockedMessage.success.mockReset()
    mockedMessage.error.mockReset()
  })

  it('loads active organizations from API for organizer selection', async () => {
    mockedListOrganizations.mockResolvedValue([organization])

    renderActivityApplyPage()

    expect(mockedListOrganizations).toHaveBeenCalledWith({ status: 'ACTIVE' })
    expect(await screen.findByRole('option', { name: organization.name })).toBeInTheDocument()
  })

  it('saves a draft through the activity application API and returns to the list', async () => {
    mockedListOrganizations.mockResolvedValue([organization])
    mockedCreateActivityApplication.mockResolvedValue(application)

    renderActivityApplyPage()
    await fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: /保存草稿/ }))

    await screen.findByText('我的申请页')
    expect(mockedCreateActivityApplication).toHaveBeenCalledWith({
      title: '校园技术开放日',
      organizationId: organization.id,
      brief: validBrief,
      expectedStart: '2026-06-10T09:00:00.000Z',
      expectedEnd: '2026-06-10T12:00:00.000Z',
      expectedScale: 80,
      budget: 1200,
      location: '紫金港校区图书馆 B201',
    })
    expect(mockedSubmitActivityApplication).not.toHaveBeenCalled()
    expect(mockedMessage.success).toHaveBeenCalledWith('草稿已保存')
  })

  it('creates and submits an application when the submit button is used', async () => {
    mockedListOrganizations.mockResolvedValue([organization])
    mockedCreateActivityApplication.mockResolvedValue(application)
    mockedSubmitActivityApplication.mockResolvedValue({
      ...application,
      status: 'SUBMITTED',
      submittedAt: '2026-06-01T08:00:00.000Z',
    })

    renderActivityApplyPage()
    await fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: /提交申请/ }))

    await screen.findByText('我的申请页')
    expect(mockedSubmitActivityApplication).toHaveBeenCalledWith(application.id)
    expect(mockedMessage.success).toHaveBeenCalledWith('已提交，自动生成审核待办')
  })

  it('shows backend error and keeps the form when saving fails', async () => {
    mockedListOrganizations.mockResolvedValue([organization])
    mockedCreateActivityApplication.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { message: '组织不存在或无权限' } } },
    })

    renderActivityApplyPage()
    await fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: /保存草稿/ }))

    await waitFor(() => {
      expect(mockedMessage.error).toHaveBeenCalledWith('组织不存在或无权限')
    })
    expect(screen.queryByText('我的申请页')).not.toBeInTheDocument()
    expect(screen.getByLabelText('活动名称')).toHaveValue('校园技术开放日')
  })
})
