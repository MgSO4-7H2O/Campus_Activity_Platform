import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from './store'

/** 未登录则跳 /login，登录后回到来时页。 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  const location = useLocation()
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

/** 仅当 viewRole 命中时才渲染（用于角色专属菜单页）。 */
export function RequireViewRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const viewRole = useAuthStore((s) => s.viewRole)
  if (!viewRole || !roles.includes(viewRole)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
