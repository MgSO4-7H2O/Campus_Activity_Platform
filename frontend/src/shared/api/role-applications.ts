import type { ApiSuccess } from '@campus-activity/shared'

import { apiClient } from './client'
import type {
  CreateRoleApplicationBody,
  Paginated,
  ReviewRoleApplicationBody,
  RoleApplicationDto,
} from './dto'

/** 1.1 普通用户：提交权限申请 */
export async function createRoleApplication(body: CreateRoleApplicationBody) {
  const res = await apiClient.post<ApiSuccess<RoleApplicationDto>>(
    '/role-applications',
    body
  )
  return res.data.data
}

/** 1.2 普通用户：查询我的权限申请记录 */
export async function listMyRoleApplications() {
  const res = await apiClient.get<ApiSuccess<RoleApplicationDto[]>>(
    '/role-applications/me'
  )
  return res.data.data
}

/** 1.3 管理员：查询权限申请列表（可分页 / 状态过滤） */
export async function listAdminRoleApplications(params?: {
  status?: string
  page?: number
  pageSize?: number
}) {
  const res = await apiClient.get<{ data: RoleApplicationDto[]; meta: { total: number; page: number; pageSize: number } }>(
    '/admin/role-applications',
    { params }
  )
  const { data: items, meta } = res.data
  return { items, total: meta.total, page: meta.page, pageSize: meta.pageSize } as Paginated<RoleApplicationDto>
}

/** 1.4 查询权限申请详情 */
export async function getRoleApplication(id: string) {
  const res = await apiClient.get<ApiSuccess<RoleApplicationDto>>(
    `/role-applications/${id}`
  )
  return res.data.data
}

/** 1.5 管理员：审核通过 / 驳回 */
export async function reviewRoleApplication(
  id: string,
  body: ReviewRoleApplicationBody
) {
  const res = await apiClient.post<ApiSuccess<RoleApplicationDto>>(
    `/role-applications/${id}/review`,
    body
  )
  return res.data.data
}
