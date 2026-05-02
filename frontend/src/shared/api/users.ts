import type { ApiSuccess } from '@campus-activity/shared'

import { apiClient } from './client'
import type { UserDto } from './types'

export async function getMe() {
  const res = await apiClient.get<ApiSuccess<UserDto>>('/users/me')
  return res.data.data
}

export async function updateMe(body: { realName?: string; phone?: string; email?: string }) {
  const res = await apiClient.patch<ApiSuccess<UserDto>>('/users/me', body)
  return res.data.data
}

export async function updateMyProfile(body: Record<string, unknown>) {
  const res = await apiClient.patch<ApiSuccess<UserDto>>('/users/me/profile', body)
  return res.data.data
}

export async function getMyRoles() {
  const res = await apiClient.get<ApiSuccess<string[]>>('/users/me/roles')
  return res.data.data
}

