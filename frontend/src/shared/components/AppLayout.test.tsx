import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '../auth/store'
import AppLayout from './AppLayout'

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<div>home page</div>} />
          <Route path="/login" element={<div>login page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

function resetAuthStore() {
  act(() => {
    useAuthStore.setState({ accessToken: null, user: null, viewRole: null })
  })
}

describe('AppLayout', () => {
  afterEach(() => {
    resetAuthStore()
  })

  it('多角色用户显示当前视图切换器和角色菜单', () => {
    act(() => {
      useAuthStore.setState({
        accessToken: 'token',
        user: {
          id: 'organizer-id',
          username: 'organizer1',
          realName: '测试负责人',
          phone: null,
          email: null,
          userType: 'STUDENT',
          status: 'ACTIVE',
          createdAt: '2026-05-11T00:00:00.000Z',
          updatedAt: '2026-05-11T00:00:00.000Z',
          roles: ['BASIC_USER', 'ORGANIZER'],
        },
        viewRole: 'ORGANIZER',
      })
    })

    renderLayout()

    expect(screen.getByText('当前视图')).toBeInTheDocument()
    expect(screen.getByText('我的活动')).toBeInTheDocument()
    expect(screen.getByText('参与活动')).toBeInTheDocument()
  })

  it('退出登录时清除本地会话并跳转登录页', async () => {
    const user = userEvent.setup()
    act(() => {
      useAuthStore.setState({
        accessToken: 'token',
        user: {
          id: 'student-id',
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

    renderLayout()

    await user.hover(screen.getByText('测试学生'))
    await user.click(await screen.findByRole('menuitem', { name: /退出登录/ }))

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
    expect(await screen.findByText('login page')).toBeInTheDocument()
  })
})
