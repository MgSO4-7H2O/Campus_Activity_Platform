import type { ApiSuccess } from '@campus-activity/shared'

import { apiClient } from './client'
import type {
  CheckinRecordDto,
  CheckinSessionDto,
  CreateCheckinSessionBody,
} from './dto'

/** 9.1 ORGANIZER 创建签到场次 */
export async function createCheckinSession(body: CreateCheckinSessionBody) {
  const res = await apiClient.post<ApiSuccess<CheckinSessionDto>>(
    '/checkin-sessions',
    body
  )
  return res.data.data
}

/** 9.2 查询活动下的所有签到场次 */
export async function listCheckinSessions(activityId: string) {
  const res = await apiClient.get<ApiSuccess<CheckinSessionDto[]>>(
    `/activities/${activityId}/checkin-sessions`
  )
  return res.data.data
}

/** 9.3 开启签到 */
export async function openCheckinSession(id: string) {
  const res = await apiClient.post<ApiSuccess<CheckinSessionDto>>(
    `/checkin-sessions/${id}/open`
  )
  return res.data.data
}

/** 9.4 关闭签到 */
export async function closeCheckinSession(id: string) {
  const res = await apiClient.post<ApiSuccess<CheckinSessionDto>>(
    `/checkin-sessions/${id}/close`
  )
  return res.data.data
}

/** 9.5 用户签到（签到码 / 扫码） */
export async function performCheckin(id: string, body: { code?: string }) {
  const res = await apiClient.post<ApiSuccess<CheckinRecordDto>>(
    `/checkin-sessions/${id}/checkin`,
    body
  )
  return res.data.data
}

/** 9.6 查询签到记录 */
export async function listCheckinRecords(id: string) {
  const res = await apiClient.get<ApiSuccess<CheckinRecordDto[]>>(
    `/checkin-sessions/${id}/records`
  )
  return res.data.data
}

/** 9.7 ORGANIZER 手动补签 */
export async function manualCheckin(
  id: string,
  body: { userId: string; status?: 'CHECKED_IN' | 'LATE' }
) {
  const res = await apiClient.post<ApiSuccess<CheckinRecordDto>>(
    `/checkin-sessions/${id}/manual-records`,
    body
  )
  return res.data.data
}
