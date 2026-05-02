import type { ApiSuccess } from '@campus-activity/shared'

import { apiClient } from './client'
import type { LoginResult } from './types'

export async function register(body: {
  username: string
  password: string
  userType: 'student' | 'teacher'
  realName?: string
  phone?: string
  email?: string
}) {
  const res = await apiClient.post<ApiSuccess<LoginResult>>('/auth/register', body)
  return res.data.data
}

export async function login(body: { username: string; password: string }) {
  const res = await apiClient.post<ApiSuccess<LoginResult>>('/auth/login', body)
  return res.data.data
}

