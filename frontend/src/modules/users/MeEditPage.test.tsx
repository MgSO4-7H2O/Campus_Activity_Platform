import { render, screen } from '../../__tests__/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { createStudentUser } from '../../test/user-fixtures'
import { getMe } from '../../shared/api/users'
import { useAuthStore } from '../../shared/auth/store'
import MeEditPage from './MeEditPage'

vi.mock('../../shared/api/users', () => ({ getMe: vi.fn(), updateMe: vi.fn() }))
const mockedGetMe = vi.mocked(getMe)

function renderEdit() {
  render(
    <Routes>
      <Route path="/me/edit" element={<MeEditPage />} />
    </Routes>,
    { initialEntries: ['/me/edit'] },
  )
}

describe('MeEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ accessToken: null, user: null, viewRole: null })
  })

  it('renders edit form', async () => {
    const studentUser = createStudentUser()
    useAuthStore.setState({ accessToken: 'token', user: studentUser, viewRole: 'BASIC_USER' })
    mockedGetMe.mockResolvedValue(studentUser)
    renderEdit()
    expect(await screen.findByText('编辑基础信息')).toBeInTheDocument()
  })
})
