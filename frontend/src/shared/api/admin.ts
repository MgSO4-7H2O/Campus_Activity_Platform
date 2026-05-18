import type { ApiSuccess } from '@campus-activity/shared'

import { apiClient } from './client'
import type {
  AdminUserDto,
  DashboardSummaryDto,
  Paginated,
  SystemLogAction,
  SystemLogDto,
} from './dto'

/** 13.1 管理员仪表盘 */
export async function getAdminDashboard() {
  const res = await apiClient.get<ApiSuccess<DashboardSummaryDto>>(
    '/admin/dashboard'
  )
  return res.data.data
}

/** 13.2 用户列表 */
export async function listAdminUsers(params?: {
  keyword?: string
  role?: string
  status?: 'ACTIVE' | 'DISABLED'
  page?: number
  pageSize?: number
}) {
  const res = await apiClient.get<ApiSuccess<Paginated<AdminUserDto>>>(
    '/admin/users',
    { params }
  )
  return res.data.data
}

/** 13.3 用户详情 */
export async function getAdminUser(id: string) {
  const res = await apiClient.get<ApiSuccess<AdminUserDto>>(`/admin/users/${id}`)
  return res.data.data
}

/** 13.4 启用 / 停用用户 */
export async function setAdminUserStatus(
  id: string,
  body: { status: 'ACTIVE' | 'DISABLED'; reason?: string }
) {
  const res = await apiClient.patch<ApiSuccess<AdminUserDto>>(
    `/admin/users/${id}/status`,
    body
  )
  return res.data.data
}

/** 13.5 系统日志 */
export async function listSystemLogs(params?: {
  action?: SystemLogAction
  actorId?: string
  resourceType?: string
  resourceId?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}) {
  const res = await apiClient.get<ApiSuccess<Paginated<SystemLogDto>>>(
    '/admin/system-logs',
    { params }
  )
  return res.data.data
}
