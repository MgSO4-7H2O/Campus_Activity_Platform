/**
 * React Query hooks for approval / review workflow.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getReviewerApplication,
  reviewActivityApplication,
  listApprovalRecords,
} from '../api/activity-applications'

// ---------- Query Keys ----------
export const approvalKeys = {
  app: (id: string) => ['approvals', 'application', id] as const,
  records: (id: string) => ['approvals', 'records', id] as const,
}

// ---------- Queries ----------

export function useReviewerApplication(id: string | undefined) {
  return useQuery({
    queryKey: approvalKeys.app(id ?? ''),
    queryFn: () => getReviewerApplication(id!),
    enabled: !!id,
  })
}

export function useApprovalRecords(id: string | undefined) {
  return useQuery({
    queryKey: approvalKeys.records(id ?? ''),
    queryFn: () => listApprovalRecords(id!),
    enabled: !!id,
  })
}

// ---------- Mutations ----------

export function useReviewApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof reviewActivityApplication>[1] }) =>
      reviewActivityApplication(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: approvalKeys.app(id) })
      qc.invalidateQueries({ queryKey: approvalKeys.records(id) })
      qc.invalidateQueries({ queryKey: ['my-applications'] })
      qc.invalidateQueries({ queryKey: ['pending-tasks'] })
    },
  })
}
