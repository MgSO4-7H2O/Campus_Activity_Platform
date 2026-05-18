import type { ApiSuccess } from '@campus-activity/shared'

import { apiClient } from './client'
import type {
  Paginated,
  RecruitmentDto,
  UpsertRecruitmentBody,
} from './dto'

/** 7.1 ORGANIZER 创建招募 */
export async function createRecruitment(body: UpsertRecruitmentBody) {
  const res = await apiClient.post<ApiSuccess<RecruitmentDto>>(
    '/recruitments',
    body
  )
  return res.data.data
}

/** 7.2 公开：查询正在招募的活动 */
export async function listRecruitments(params?: {
  status?: 'PUBLISHED' | 'CLOSED' | 'DRAFT'
  page?: number
  pageSize?: number
}) {
  const res = await apiClient.get<ApiSuccess<Paginated<RecruitmentDto>>>(
    '/recruitments',
    { params }
  )
  return res.data.data
}

/** 7.3 招募详情 */
export async function getRecruitment(id: string) {
  const res = await apiClient.get<ApiSuccess<RecruitmentDto>>(
    `/recruitments/${id}`
  )
  return res.data.data
}

/** 7.4 编辑招募（仅 draft） */
export async function updateRecruitment(
  id: string,
  body: Partial<UpsertRecruitmentBody>
) {
  const res = await apiClient.patch<ApiSuccess<RecruitmentDto>>(
    `/recruitments/${id}`,
    body
  )
  return res.data.data
}

/** 7.5 发布招募 */
export async function publishRecruitment(id: string) {
  const res = await apiClient.post<ApiSuccess<RecruitmentDto>>(
    `/recruitments/${id}/publish`
  )
  return res.data.data
}

/** 7.6 关闭招募 */
export async function closeRecruitment(id: string) {
  const res = await apiClient.post<ApiSuccess<RecruitmentDto>>(
    `/recruitments/${id}/close`
  )
  return res.data.data
}
