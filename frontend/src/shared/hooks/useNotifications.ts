/**
 * React Query hooks for notifications.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notifications'

// ---------- Query Keys ----------
export const notificationKeys = {
  list: (params?: { read?: boolean; page?: number; pageSize?: number }) =>
    ['notifications', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
}

// ---------- Queries ----------

export function useNotifications(params?: { read?: boolean; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => listNotifications(params),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
  })
}

// ---------- Mutations ----------

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
