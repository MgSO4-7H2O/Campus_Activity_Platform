import type { ApiSuccess } from '@campus-activity/shared'

import { apiClient } from './client'
import type { NotificationDto, Paginated } from './dto'

/** 12.1 当前用户通知列表 */
export async function listNotifications(params?: {
  read?: boolean
  page?: number
  pageSize?: number
}) {
  const res = await apiClient.get<{ data: NotificationDto[]; meta: { total: number; page: number; pageSize: number } }>(
    '/notifications',
    { params }
  )
  const { data: items, meta } = res.data
  return { items, total: meta.total, page: meta.page, pageSize: meta.pageSize } as Paginated<NotificationDto>
}

/** 12.2 未读数（用于顶栏 badge） */
export async function getUnreadCount() {
  const res = await apiClient.get<ApiSuccess<{ count: number }>>(
    '/notifications/unread-count'
  )
  return res.data.data.count
}

/** 12.3 标记单条已读 */
export async function markNotificationRead(id: string) {
  const res = await apiClient.patch<ApiSuccess<NotificationDto>>(
    `/notifications/${id}/read`
  )
  return res.data.data
}

/** 12.4 一键全部已读 */
export async function markAllNotificationsRead() {
  await apiClient.patch('/notifications/read-all')
}
