import type { ApiSuccess } from '@campus-activity/shared'

import { apiClient } from './client'
import type {
  ApplicationAttachmentDto,
  ApprovalRecordDto,
  ClosureApplicationDto,
  Paginated,
  ReviewActivityApplicationBody,
  UpsertClosureApplicationBody,
} from './dto'

/** 10.1 ORGANIZER 创建结项申请 */
export async function createClosureApplication(
  body: UpsertClosureApplicationBody
) {
  const res = await apiClient.post<ApiSuccess<ClosureApplicationDto>>(
    '/closure-applications',
    body
  )
  return res.data.data
}

/** 10.2 我的结项申请列表 */
export async function listMyClosureApplications(params?: {
  status?: string
  page?: number
  pageSize?: number
}) {
  const res = await apiClient.get<ApiSuccess<Paginated<ClosureApplicationDto>>>(
    '/closure-applications/me',
    { params }
  )
  return res.data.data
}

/** 10.3 结项申请详情 */
export async function getClosureApplication(id: string) {
  const res = await apiClient.get<ApiSuccess<ClosureApplicationDto>>(
    `/closure-applications/${id}`
  )
  return res.data.data
}

/** 10.4 编辑结项申请（仅 draft / need_more） */
export async function updateClosureApplication(
  id: string,
  body: Partial<UpsertClosureApplicationBody>
) {
  const res = await apiClient.patch<ApiSuccess<ClosureApplicationDto>>(
    `/closure-applications/${id}`,
    body
  )
  return res.data.data
}

/** 10.5 上传结项材料 */
export async function uploadClosureAttachment(id: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await apiClient.post<ApiSuccess<ApplicationAttachmentDto>>(
    `/closure-applications/${id}/attachments`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return res.data.data
}

/** 10.6 提交结项 */
export async function submitClosureApplication(id: string) {
  const res = await apiClient.post<ApiSuccess<ClosureApplicationDto>>(
    `/closure-applications/${id}/submit`
  )
  return res.data.data
}

/** 10.7 REVIEWER 审核结项 */
export async function reviewClosureApplication(
  id: string,
  body: ReviewActivityApplicationBody
) {
  const res = await apiClient.post<ApiSuccess<ClosureApplicationDto>>(
    `/closure-applications/${id}/review`,
    body
  )
  return res.data.data
}

/** 10.8 结项审核记录 */
export async function listClosureReviewRecords(id: string) {
  const res = await apiClient.get<ApiSuccess<ApprovalRecordDto[]>>(
    `/closure-applications/${id}/review-records`
  )
  return res.data.data
}
