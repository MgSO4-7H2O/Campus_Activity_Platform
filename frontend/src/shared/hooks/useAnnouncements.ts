/**
 * React Query hooks for announcements.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
} from '../api/announcements'
import type { AnnouncementCategory } from '../api/dto'

// ---------- Query Keys ----------
export const announcementKeys = {
  list: (params?: { category?: AnnouncementCategory; pinned?: boolean; page?: number; pageSize?: number }) =>
    ['announcements', params] as const,
  detail: (id: string) => ['announcements', id] as const,
}

// ---------- Queries ----------

export function useAnnouncements(params?: { category?: AnnouncementCategory; pinned?: boolean; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: announcementKeys.list(params),
    queryFn: () => listAnnouncements(params),
  })
}

export function useAnnouncement(id: string | undefined) {
  return useQuery({
    queryKey: announcementKeys.detail(id ?? ''),
    queryFn: () => getAnnouncement(id!),
    enabled: !!id,
  })
}

// ---------- Mutations ----------

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateAnnouncement>[1] }) =>
      updateAnnouncement(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: announcementKeys.detail(id) })
      qc.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}

export function usePublishAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: publishAnnouncement,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: announcementKeys.detail(id) })
      qc.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}

export function useArchiveAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: archiveAnnouncement,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: announcementKeys.detail(id) })
      qc.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}
