import { render, screen } from '../../__tests__/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import RegisterPage from './RegisterPage'

vi.mock('../../shared/api/auth', () => ({ register: vi.fn() }))

function renderRegister() {
  render(
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
    </Routes>,
    { initialEntries: ['/register'] },
  )
}

describe('RegisterPage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders registration form', async () => {
    renderRegister()
    expect(screen.getByText('注册新账号')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /注册/ })).toBeInTheDocument()
  })
})
