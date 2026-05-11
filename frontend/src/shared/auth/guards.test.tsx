import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { RequireAuth } from './guards'
import { useAuthStore } from './store'

function resetAuthStore() {
  act(() => {
    useAuthStore.setState({ accessToken: null, user: null, viewRole: null })
  })
}

describe('RequireAuth', () => {
  afterEach(() => {
    resetAuthStore()
  })

  it('未登录访问受保护页面时跳转登录页', async () => {
    resetAuthStore()

    render(
      <MemoryRouter initialEntries={['/me']}>
        <Routes>
          <Route
            path="/me"
            element={
              <RequireAuth>
                <div>protected content</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('已登录访问受保护页面时渲染子内容', () => {
    act(() => {
      useAuthStore.setState({
        accessToken: 'token',
        user: {
          id: 'user-id',
          username: 'student1',
          realName: '测试学生',
          phone: null,
          email: null,
          userType: 'STUDENT',
          status: 'ACTIVE',
          createdAt: '2026-05-11T00:00:00.000Z',
          updatedAt: '2026-05-11T00:00:00.000Z',
          roles: ['BASIC_USER'],
        },
        viewRole: 'BASIC_USER',
      })
    })

    render(
      <MemoryRouter initialEntries={['/me']}>
        <Routes>
          <Route
            path="/me"
            element={
              <RequireAuth>
                <div>protected content</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('protected content')).toBeInTheDocument()
    expect(screen.queryByText('login page')).not.toBeInTheDocument()
  })
})
