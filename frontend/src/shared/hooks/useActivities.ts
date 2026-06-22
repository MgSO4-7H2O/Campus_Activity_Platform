/**
 * React Query hooks for activities (正式活动).
 */
import { useQuery } from '@tanstack/react-query'
import {
  listActivities,
  listMyActivities,
  getActivity,
} from '../api/activities'
import type { ActivityStatus } from '../api/dto'

// ---------- Query Keys ----------
export const activityKeys = {
  list: (params?: { status?: ActivityStatus; keyword?: string; page?: number; pageSize?: number }) =>
    ['activities', 'list', params] as const,
  my: ['activities', 'my'] as const,
  detail: (id: string) => ['activities', id] as const,
}

// ---------- Queries ----------

export function useActivities(params?: { status?: ActivityStatus; keyword?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: activityKeys.list(params),
    queryFn: () => listActivities(params),
  })
}

export function useMyActivities(params?: { status?: ActivityStatus; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: [...activityKeys.my, params],
    queryFn: () => listMyActivities(params),
  })
}

export function useActivity(id: string | undefined) {
  return useQuery({
    queryKey: activityKeys.detail(id ?? ''),
    queryFn: () => getActivity(id!),
    enabled: !!id,
  })
}
