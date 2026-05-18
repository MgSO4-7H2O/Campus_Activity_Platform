import type { ApiSuccess } from '@campus-activity/shared'

import { apiClient } from './client'
import type {
  ActivityDto,
  ActivityStatus,
  Paginated,
} from './dto'

/** 6.1 公开活动列表 */
export async function listActivities(params?: {
  status?: ActivityStatus
  keyword?: string
  page?: number
  pageSize?: number
}) {
  const res = await apiClient.get<ApiSuccess<Paginated<ActivityDto>>>(
    '/activities',
    { params }
  )
  return res.data.data
}

/** 6.2 我负责的活动 */
export async function listMyActivities(params?: {
  status?: ActivityStatus
  page?: number
  pageSize?: number
}) {
  const res = await apiClient.get<ApiSuccess<Paginated<ActivityDto>>>(
    '/activities/me',
    { params }
  )
  return res.data.data
}

/** 6.3 活动详情 */
export async function getActivity(id: string) {
  const res = await apiClient.get<ApiSuccess<ActivityDto>>(`/activities/${id}`)
  return res.data.data
}

/** 6.4 状态动作（明确动词接口，不建议直接 PATCH status） */
export async function startActivity(id: string) {
  const res = await apiClient.post<ApiSuccess<ActivityDto>>(
    `/activities/${id}/start`
  )
  return res.data.data
}

export async function finishActivity(id: string) {
  const res = await apiClient.post<ApiSuccess<ActivityDto>>(
    `/activities/${id}/finish`
  )
  return res.data.data
}
