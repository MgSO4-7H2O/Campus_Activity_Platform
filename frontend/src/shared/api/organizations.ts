import type { ApiSuccess } from '@campus-activity/shared'

import { apiClient } from './client'
import type {
  CreateOrganizationBody,
  OrganizationDto,
  OrganizationNode,
  UpdateOrganizationBody,
  UserOrganizationDto,
} from './dto'

/** 2.1 查询所有组织 */
export async function listOrganizations(params?: {
  type?: string
  status?: string
}) {
  const res = await apiClient.get<ApiSuccess<OrganizationDto[]>>(
    '/organizations',
    { params }
  )
  return res.data.data
}

/** 2.2 查询组织树（含 parent / children 关系） */
export async function getOrganizationTree() {
  const res = await apiClient.get<ApiSuccess<OrganizationNode[]>>(
    '/organizations/tree'
  )
  return res.data.data
}

/** 2.3 查询组织详情 */
export async function getOrganization(id: string) {
  const res = await apiClient.get<ApiSuccess<OrganizationDto>>(
    `/organizations/${id}`
  )
  return res.data.data
}

/** 2.4 管理员：新增组织 */
export async function createOrganization(body: CreateOrganizationBody) {
  const res = await apiClient.post<ApiSuccess<OrganizationDto>>(
    '/admin/organizations',
    body
  )
  return res.data.data
}

/** 2.5 管理员：更新组织（名称 / 类型 / 父级 / 状态） */
export async function updateOrganization(
  id: string,
  body: UpdateOrganizationBody
) {
  const res = await apiClient.patch<ApiSuccess<OrganizationDto>>(
    `/admin/organizations/${id}`,
    body
  )
  return res.data.data
}

/** 2.6 管理员：为用户绑定组织 */
export async function addUserOrganization(
  userId: string,
  body: { organizationId: string; role?: 'ORGANIZER' | 'REVIEWER' | 'MEMBER' }
) {
  const res = await apiClient.post<ApiSuccess<UserOrganizationDto>>(
    `/admin/users/${userId}/organizations`,
    body
  )
  return res.data.data
}

/** 2.7 管理员：移除用户与组织的关联 */
export async function removeUserOrganization(
  userId: string,
  organizationId: string
) {
  await apiClient.delete(
    `/admin/users/${userId}/organizations/${organizationId}`
  )
}

/** 2.8 查询某用户所属组织（自助 / 管理） */
export async function listUserOrganizations(userId: string) {
  const res = await apiClient.get<ApiSuccess<UserOrganizationDto[]>>(
    `/admin/users/${userId}/organizations`
  )
  return res.data.data
}
