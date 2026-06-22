/**
 * React Query hooks for checkin (签到).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createCheckinSession,
  listCheckinRecords,
  listCheckinSessions,
} from '../api/checkin'

// ---------- Query Keys ----------
export const checkinKeys = {
  sessions: (activityId: string) => ['checkin-sessions', activityId] as const,
  records: (sessionId: string) => ['checkin-records', sessionId] as const,
}

// ---------- Queries ----------

export function useCheckinSessions(activityId: string | undefined) {
  return useQuery({
    queryKey: checkinKeys.sessions(activityId ?? ''),
    queryFn: () => listCheckinSessions(activityId!),
    enabled: !!activityId,
  })
}

export function useCheckinRecords(sessionId: string | undefined) {
  return useQuery({
    queryKey: checkinKeys.records(sessionId ?? ''),
    queryFn: () => listCheckinRecords(sessionId!),
    enabled: !!sessionId,
  })
}

// ---------- Mutations ----------

export function useCreateCheckinSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof createCheckinSession>[0]) =>
      createCheckinSession(body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['checkin-sessions', data.activityId] })
    },
  })
}
