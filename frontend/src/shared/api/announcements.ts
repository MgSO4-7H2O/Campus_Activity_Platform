import type { ApiSuccess } from '@campus-activity/shared'

import { apiClient } from './client'
import type {
  AnnouncementCategory,
  AnnouncementDto,
  Paginated,
  UpsertAnnouncementBody,
} from './dto'

/** 11.1 公告列表 */
export async function listAnnouncements(params?: {
  category?: AnnouncementCategory
  pinned?: boolean
  page?: number
  pageSize?: number
}) {
  const res = await apiClient.get<{ data: AnnouncementDto[]; meta: { total: number; page: number; pageSize: number } }>(
    '/announcements',
    { params }
  )
  const { data: items, meta } = res.data
  return { items, total: meta.total, page: meta.page, pageSize: meta.pageSize } as Paginated<AnnouncementDto>
}

/** 11.2 公告详情 */
export async function getAnnouncement(id: string) {
  const res = await apiClient.get<ApiSuccess<AnnouncementDto>>(
    `/announcements/${id}`
  )
  return res.data.data
}

/** 11.3 创建公告（草稿） */
export async function createAnnouncement(body: UpsertAnnouncementBody) {
  const res = await apiClient.post<ApiSuccess<AnnouncementDto>>(
    '/announcements',
    body
  )
  return res.data.data
}

/** 11.4 编辑公告 */
export async function updateAnnouncement(
  id: string,
  body: Partial<UpsertAnnouncementBody>
) {
  const res = await apiClient.patch<ApiSuccess<AnnouncementDto>>(
    `/announcements/${id}`,
    body
  )
  return res.data.data
}

/** 11.5 发布公告 */
export async function publishAnnouncement(id: string) {
  const res = await apiClient.post<ApiSuccess<AnnouncementDto>>(
    `/announcements/${id}/publish`
  )
  return res.data.data
}

/** 11.6 归档公告 */
export async function archiveAnnouncement(id: string) {
  const res = await apiClient.post<ApiSuccess<AnnouncementDto>>(
    `/announcements/${id}/archive`
  )
  return res.data.data
}
