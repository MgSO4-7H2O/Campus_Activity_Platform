import { render, screen } from '../../__tests__/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { createStudentUser } from '../../test/user-fixtures'
import { getMe } from '../../shared/api/users'
import { useAuthStore } from '../../shared/auth/store'
import MeProfilePage from './MeProfilePage'

vi.mock('../../shared/api/users', () => ({ getMe: vi.fn(), updateMyProfile: vi.fn() }))
const mockedGetMe = vi.mocked(getMe)

function renderProfile() {
  render(
    <Routes>
      <Route path="/me/profile" element={<MeProfilePage />} />
    </Routes>,
    { initialEntries: ['/me/profile'] },
  )
}

describe('MeProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ accessToken: null, user: null, viewRole: null })
  })

  it('renders student profile form', async () => {
    const studentUser = createStudentUser()
    useAuthStore.setState({ accessToken: 'token', user: studentUser, viewRole: 'BASIC_USER' })
    mockedGetMe.mockResolvedValue(studentUser)
    renderProfile()
    expect(await screen.findByText('编辑扩展资料')).toBeInTheDocument()
  })
})
