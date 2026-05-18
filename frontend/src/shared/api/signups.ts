import type { ApiSuccess } from '@campus-activity/shared'

import { apiClient } from './client'
import type {
  Paginated,
  ReviewSignupBody,
  SignupAttachmentDto,
  SignupDto,
} from './dto'

/** 8.1 提交报名 */
export async function createSignup(
  recruitmentId: string,
  body?: { remark?: string }
) {
  const res = await apiClient.post<ApiSuccess<SignupDto>>(
    `/recruitments/${recruitmentId}/signups`,
    body ?? {}
  )
  return res.data.data
}

/** 8.2 我的报名记录 */
export async function listMySignups(params?: { page?: number; pageSize?: number }) {
  const res = await apiClient.get<ApiSuccess<Paginated<SignupDto>>>(
    '/signups/me',
    { params }
  )
  return res.data.data
}

/** 8.3 取消报名 */
export async function cancelSignup(id: string) {
  const res = await apiClient.post<ApiSuccess<SignupDto>>(
    `/signups/${id}/cancel`
  )
  return res.data.data
}

/** 8.4 ORGANIZER：查看招募下所有报名 */
export async function listSignupsByRecruitment(
  recruitmentId: string,
  params?: { status?: string; page?: number; pageSize?: number }
) {
  const res = await apiClient.get<ApiSuccess<Paginated<SignupDto>>>(
    `/recruitments/${recruitmentId}/signups`,
    { params }
  )
  return res.data.data
}

/** 8.5 报名详情 */
export async function getSignup(id: string) {
  const res = await apiClient.get<ApiSuccess<SignupDto>>(`/signups/${id}`)
  return res.data.data
}

/** 8.6 ORGANIZER：审核报名 */
export async function reviewSignup(id: string, body: ReviewSignupBody) {
  const res = await apiClient.post<ApiSuccess<SignupDto>>(
    `/signups/${id}/review`,
    body
  )
  return res.data.data
}

/** 8.7 上传报名材料 */
export async function uploadSignupAttachment(id: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await apiClient.post<ApiSuccess<SignupAttachmentDto>>(
    `/signups/${id}/attachments`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return res.data.data
}
