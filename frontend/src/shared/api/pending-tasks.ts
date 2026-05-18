import type { ApiSuccess } from '@campus-activity/shared'

import { apiClient } from './client'
import type { PendingTaskDto, PendingTaskStatus } from './dto'

/** 3.1 当前用户的待办列表（可按状态过滤） */
export async function listMyPendingTasks(params?: {
  status?: PendingTaskStatus
}) {
  const res = await apiClient.get<ApiSuccess<PendingTaskDto[]>>(
    '/pending-tasks/me',
    { params }
  )
  return res.data.data
}

/** 3.2 待办详情 */
export async function getPendingTask(id: string) {
  const res = await apiClient.get<ApiSuccess<PendingTaskDto>>(
    `/pending-tasks/${id}`
  )
  return res.data.data
}

/** 3.3 标记待办已处理（业务流程内部调用，也可手动跳过） */
export async function processPendingTask(id: string) {
  const res = await apiClient.patch<ApiSuccess<PendingTaskDto>>(
    `/pending-tasks/${id}/process`
  )
  return res.data.data
}
