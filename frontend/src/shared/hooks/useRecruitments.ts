/**
 * React Query hooks for recruitments and signups.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRecruitment,
  listRecruitments,
  getRecruitment,
  updateRecruitment,
  publishRecruitment,
  closeRecruitment,
} from '../api/recruitments'
import {
  createSignup,
  listMySignups,
  cancelSignup,
  listSignupsByRecruitment,
  reviewSignup,
} from '../api/signups'

// ---------- Query Keys ----------
export const recruitmentKeys = {
  list: (params?: { status?: string; page?: number; pageSize?: number }) =>
    ['recruitments', 'list', params] as const,
  detail: (id: string) => ['recruitments', id] as const,
  signups: (recruitmentId: string, params?: { status?: string; page?: number; pageSize?: number }) =>
    ['recruitments', recruitmentId, 'signups', params] as const,
  mySignups: ['signups', 'my'] as const,
}

// ---------- Queries ----------

export function useRecruitments(params?: { status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED'; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: recruitmentKeys.list(params),
    queryFn: () => listRecruitments(params),
  })
}

export function useRecruitment(id: string | undefined) {
  return useQuery({
    queryKey: recruitmentKeys.detail(id ?? ''),
    queryFn: () => getRecruitment(id!),
    enabled: !!id,
  })
}

export function useRecruitmentSignups(recruitmentId: string, params?: { status?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: recruitmentKeys.signups(recruitmentId, params),
    queryFn: () => listSignupsByRecruitment(recruitmentId, params),
    enabled: !!recruitmentId,
  })
}

export function useMySignups(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: [...recruitmentKeys.mySignups, params],
    queryFn: () => listMySignups(params),
  })
}

// ---------- Mutations ----------

export function useCreateRecruitment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createRecruitment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recruitments'] })
      qc.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

export function useUpdateRecruitment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateRecruitment>[1] }) =>
      updateRecruitment(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: recruitmentKeys.detail(id) })
      qc.invalidateQueries({ queryKey: ['recruitments'] })
    },
  })
}

export function usePublishRecruitment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: publishRecruitment,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: recruitmentKeys.detail(id) })
      qc.invalidateQueries({ queryKey: ['recruitments'] })
    },
  })
}

export function useCloseRecruitment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: closeRecruitment,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: recruitmentKeys.detail(id) })
      qc.invalidateQueries({ queryKey: ['recruitments'] })
    },
  })
}

export function useCreateSignup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ recruitmentId, body }: { recruitmentId: string; body?: { remark?: string } }) =>
      createSignup(recruitmentId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signups'] })
    },
  })
}

export function useCancelSignup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cancelSignup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signups'] })
    },
  })
}

export function useReviewSignup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof reviewSignup>[1] }) =>
      reviewSignup(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signups'] })
    },
  })
}
