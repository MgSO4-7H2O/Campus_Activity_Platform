import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { LoginResult, UserDto } from '../api/types'

export type SessionUser = LoginResult['user']

export const ROLE_LABELS: Record<string, string> = {
  BASIC_USER: '普通用户',
  ORGANIZER: '活动负责人',
  REVIEWER: '审核人',
  SYS_ADMIN: '系统管理员',
}

type AuthState = {
  accessToken: string | null
  user: SessionUser | null
  /** 演示用：当用户拥有多角色时，可切换"以哪种角色身份查看"。 */
  viewRole: string | null
  setSession: (token: string, user: SessionUser) => void
  setUser: (user: SessionUser | UserDto | null) => void
  setViewRole: (role: string | null) => void
  logout: () => void
}

const toSessionUser = (u: SessionUser | UserDto | null): SessionUser | null => {
  if (!u) return null
  // UserDto 中可能含 studentProfile/teacherProfile，过滤后存到 session。
  const { id, username, realName, phone, email, userType, status, createdAt, updatedAt, roles } = u
  return { id, username, realName, phone, email, userType, status, createdAt, updatedAt, roles }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      viewRole: null,
      setSession: (token, user) => set({ accessToken: token, user, viewRole: pickDefaultRole(user.roles) }),
      setUser: (user) => {
        const session = toSessionUser(user)
        set({ user: session, viewRole: get().viewRole ?? (session ? pickDefaultRole(session.roles) : null) })
      },
      setViewRole: (role) => set({ viewRole: role }),
      logout: () => set({ accessToken: null, user: null, viewRole: null }),
    }),
    { name: 'cap-auth' }
  )
)

function pickDefaultRole(roles: string[]): string | null {
  if (!roles.length) return null
  // 优先选最高权限角色作为默认视图，便于一登录就看到对应菜单。
  const order = ['SYS_ADMIN', 'REVIEWER', 'ORGANIZER', 'BASIC_USER']
  return order.find((r) => roles.includes(r)) ?? roles[0]
}

export const hasRole = (user: SessionUser | null, role: string) => !!user?.roles.includes(role)
