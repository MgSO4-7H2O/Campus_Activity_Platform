/**
 * React Query hooks for pending tasks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listMyPendingTasks, processPendingTask } from '../api/pending-tasks'
import type { PendingTaskStatus } from '../api/dto'

// ---------- Query Keys ----------
export const taskKeys = {
  my: (params?: { status?: PendingTaskStatus }) => ['pending-tasks', params] as const,
}

// ---------- Queries ----------

export function useMyPendingTasks(params?: { status?: PendingTaskStatus }) {
  return useQuery({
    queryKey: taskKeys.my(params),
    queryFn: () => listMyPendingTasks(params),
    refetchInterval: 30_000,
  })
}

// ---------- Mutations ----------

export function useProcessTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: processPendingTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-tasks'] })
    },
  })
}
