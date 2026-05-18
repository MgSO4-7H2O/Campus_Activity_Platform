import type { ApiSuccess } from '@campus-activity/shared'

import { apiClient } from './client'
import type {
  ActivityApplicationDto,
  ApplicationAttachmentDto,
  ApprovalRecordDto,
  Paginated,
  ReviewActivityApplicationBody,
  UpsertActivityApplicationBody,
} from './dto'

// ---------- 4. ORGANIZER 侧：创建 / 编辑 / 提交立项 ----------

export async function createActivityApplication(
  body: UpsertActivityApplicationBody
) {
  const res = await apiClient.post<ApiSuccess<ActivityApplicationDto>>(
    '/activity-applications',
    body
  )
  return res.data.data
}

export async function listMyActivityApplications(params?: {
  status?: string
  page?: number
  pageSize?: number
}) {
  const res = await apiClient.get<ApiSuccess<Paginated<ActivityApplicationDto>>>(
    '/activity-applications/me',
    { params }
  )
  return res.data.data
}

export async function getActivityApplication(id: string) {
  const res = await apiClient.get<ApiSuccess<ActivityApplicationDto>>(
    `/activity-applications/${id}`
  )
  return res.data.data
}

export async function updateActivityApplication(
  id: string,
  body: Partial<UpsertActivityApplicationBody>
) {
  const res = await apiClient.patch<ApiSuccess<ActivityApplicationDto>>(
    `/activity-applications/${id}`,
    body
  )
  return res.data.data
}

export async function submitActivityApplication(id: string) {
  const res = await apiClient.post<ApiSuccess<ActivityApplicationDto>>(
    `/activity-applications/${id}/submit`
  )
  return res.data.data
}

// ---------- 附件 ----------

export async function uploadApplicationAttachment(
  applicationId: string,
  file: File
) {
  const form = new FormData()
  form.append('file', file)
  const res = await apiClient.post<ApiSuccess<ApplicationAttachmentDto>>(
    `/activity-applications/${applicationId}/attachments`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return res.data.data
}

export async function deleteApplicationAttachment(
  applicationId: string,
  attachmentId: string
) {
  await apiClient.delete(
    `/activity-applications/${applicationId}/attachments/${attachmentId}`
  )
}

// ---------- 5. REVIEWER 侧：审核 ----------

export async function getReviewerApplication(id: string) {
  const res = await apiClient.get<ApiSuccess<ActivityApplicationDto>>(
    `/approval/activity-applications/${id}`
  )
  return res.data.data
}

export async function reviewActivityApplication(
  id: string,
  body: ReviewActivityApplicationBody
) {
  const res = await apiClient.post<ApiSuccess<ActivityApplicationDto>>(
    `/approval/activity-applications/${id}/review`,
    body
  )
  return res.data.data
}

export async function listApprovalRecords(id: string) {
  const res = await apiClient.get<ApiSuccess<ApprovalRecordDto[]>>(
    `/activity-applications/${id}/approval-records`
  )
  return res.data.data
}
