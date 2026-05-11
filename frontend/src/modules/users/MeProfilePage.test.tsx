import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createStudentUser, createTeacherUser } from '../../test/user-fixtures'
import { getMe, updateMyProfile } from '../../shared/api/users'
import MeProfilePage from './MeProfilePage'

vi.mock('../../shared/api/users', () => ({
  getMe: vi.fn(),
  updateMyProfile: vi.fn(),
}))

const mockedGetMe = vi.mocked(getMe)
const mockedUpdateMyProfile = vi.mocked(updateMyProfile)

describe('MeProfilePage', () => {
  beforeEach(() => {
    mockedGetMe.mockReset()
    mockedUpdateMyProfile.mockReset()
  })

  it('学生用户渲染学生扩展资料字段', async () => {
    mockedGetMe.mockResolvedValue(createStudentUser())

    render(
      <MemoryRouter>
        <MeProfilePage />
      </MemoryRouter>
    )

    expect(await screen.findByLabelText('学院')).toBeInTheDocument()
    expect(screen.getByLabelText('专业')).toBeInTheDocument()
    expect(screen.getByLabelText('年级')).toBeInTheDocument()
    expect(screen.getByLabelText('班级')).toBeInTheDocument()
    expect(screen.queryByLabelText('部门')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('职称')).not.toBeInTheDocument()
  })

  it('教师用户渲染教师扩展资料字段', async () => {
    mockedGetMe.mockResolvedValue(createTeacherUser())

    render(
      <MemoryRouter>
        <MeProfilePage />
      </MemoryRouter>
    )

    expect(await screen.findByLabelText('部门')).toBeInTheDocument()
    expect(screen.getByLabelText('职称')).toBeInTheDocument()
    expect(screen.queryByLabelText('学院')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('专业')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('年级')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('班级')).not.toBeInTheDocument()
  })
})
