import { render, screen } from '../../__tests__/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getMe } from '../../shared/api/users'
import { useAuthStore } from '../../shared/auth/store'
import { createStudentUser } from '../../test/user-fixtures'
import MePage from './MePage'

vi.mock('../../shared/api/users', () => ({ getMe: vi.fn() }))
const mockedGetMe = vi.mocked(getMe)

describe('MePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ accessToken: null, user: null, viewRole: null })
  })

  it('renders profile page when authenticated', async () => {
    const studentUser = createStudentUser()
    useAuthStore.setState({ accessToken: 'token', user: studentUser, viewRole: 'BASIC_USER' })
    mockedGetMe.mockResolvedValue(studentUser)
    render(<MePage />)
    expect(await screen.findByText('个人信息')).toBeInTheDocument()
  })
})
