import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '../../shared/auth/store'
import { createStudentUser } from '../../test/user-fixtures'
import ActivityRegisterPage from './ActivityRegisterPage'
import MyRegistrationsPage from './MyRegistrationsPage'

describe('Recruitment pages', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession('test-token', createStudentUser())
  })

  it('renders registration form for a published recruitment', () => {
    render(
      <MemoryRouter initialEntries={['/activities/act-001/register']}>
        <Routes>
          <Route path="/activities/:id/register" element={<ActivityRegisterPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: '报名' })).toBeInTheDocument()
    expect(screen.getAllByText('2026 春季编程马拉松')[0]).toBeInTheDocument()
    expect(screen.getByText('用户类型：STUDENT')).toBeInTheDocument()
    expect(screen.getByText('年级：2023 / 2024 / 2025')).toBeInTheDocument()
    expect(screen.getByText('报名材料')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '提交报名' })).toBeInTheDocument()
  })

  it('shows unavailable registration state when recruitment is not published', () => {
    render(
      <MemoryRouter initialEntries={['/activities/act-002/register']}>
        <Routes>
          <Route path="/activities/:id/register" element={<ActivityRegisterPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('该活动当前未开放报名')).toBeInTheDocument()
  })

  it('renders my registrations with approved checkin action and rejection reason', () => {
    render(
      <MemoryRouter>
        <MyRegistrationsPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: '我的报名' })).toBeInTheDocument()
    expect(screen.getByText('待审核')).toBeInTheDocument()
    expect(screen.getByText('已通过')).toBeInTheDocument()
    expect(screen.getByText('未通过')).toBeInTheDocument()
    expect(screen.getByText('专业不符合招募要求。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '去签到' })).toBeInTheDocument()
  })
})
