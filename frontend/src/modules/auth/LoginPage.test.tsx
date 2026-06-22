import { render, screen } from '../../__tests__/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import LoginPage from './LoginPage'

vi.mock('../../shared/api/auth', () => ({ login: vi.fn() }))

function renderLogin() {
  render(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
    </Routes>,
    { initialEntries: ['/login'] },
  )
}

describe('LoginPage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders login form', async () => {
    renderLogin()
    expect(screen.getByText('欢迎登录')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('如 student1')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('至少 8 位')).toBeInTheDocument()
  })
})
