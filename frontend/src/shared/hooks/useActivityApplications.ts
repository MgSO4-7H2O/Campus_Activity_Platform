/**
 * React Query hooks for activity applications (立项申请).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createActivityApplication,
  listMyActivityApplications,
  getActivityApplication,
  updateActivityApplication,
  submitActivityApplication,
  uploadApplicationAttachment,
  deleteApplicationAttachment,
} from '../api/activity-applications'

// ---------- Query Keys ----------
export const appKeys = {
  myApps: ['my-applications'] as const,
  app: (id: string) => ['applications', id] as const,
}

// ---------- Queries ----------

export function useMyApplications(params?: { status?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: [...appKeys.myApps, params],
    queryFn: () => listMyActivityApplications(params),
  })
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: appKeys.app(id ?? ''),
    queryFn: () => getActivityApplication(id!),
    enabled: !!id,
  })
}

// ---------- Mutations ----------

export function useCreateApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createActivityApplication,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appKeys.myApps })
    },
  })
}

export function useUpdateApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateActivityApplication>[1] }) =>
      updateActivityApplication(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: appKeys.app(id) })
      qc.invalidateQueries({ queryKey: appKeys.myApps })
    },
  })
}

export function useSubmitApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: submitActivityApplication,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: appKeys.app(id) })
      qc.invalidateQueries({ queryKey: appKeys.myApps })
    },
  })
}

export function useUploadAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadApplicationAttachment(id, file),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: appKeys.app(id) })
    },
  })
}

export function useDeleteAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appId, attachmentId }: { appId: string; attachmentId: string }) =>
      deleteApplicationAttachment(appId, attachmentId),
    onSuccess: (_, { appId }) => {
      qc.invalidateQueries({ queryKey: appKeys.app(appId) })
    },
  })
}
