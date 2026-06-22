/**
 * React Query hooks for closure applications (结项).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createClosureApplication,
  listMyClosureApplications,
  getClosureApplication,
  submitClosureApplication,
  reviewClosureApplication,
  listClosureReviewRecords,
} from '../api/closures'
import type { ReviewActivityApplicationBody } from '../api/dto'

// ---------- Query Keys ----------
export const closureKeys = {
  my: ['closures', 'my'] as const,
  detail: (id: string) => ['closures', id] as const,
  records: (id: string) => ['closures', 'records', id] as const,
}

// ---------- Queries ----------

export function useMyClosureApplications(params?: { status?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: [...closureKeys.my, params],
    queryFn: () => listMyClosureApplications(params),
  })
}

export function useClosureApplication(id: string | undefined) {
  return useQuery({
    queryKey: closureKeys.detail(id ?? ''),
    queryFn: () => getClosureApplication(id!),
    enabled: !!id,
  })
}

export function useClosureReviewRecords(id: string | undefined) {
  return useQuery({
    queryKey: closureKeys.records(id ?? ''),
    queryFn: () => listClosureReviewRecords(id!),
    enabled: !!id,
  })
}

// ---------- Mutations ----------

export function useCreateClosure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createClosureApplication,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['closures'] })
    },
  })
}

export function useSubmitClosure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: submitClosureApplication,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: closureKeys.detail(id) })
      qc.invalidateQueries({ queryKey: ['closures'] })
    },
  })
}

export function useReviewClosure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReviewActivityApplicationBody }) =>
      reviewClosureApplication(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: closureKeys.detail(id) })
      qc.invalidateQueries({ queryKey: closureKeys.records(id) })
      qc.invalidateQueries({ queryKey: ['closures'] })
      qc.invalidateQueries({ queryKey: ['pending-tasks'] })
    },
  })
}
