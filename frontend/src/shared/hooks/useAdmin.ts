/**
 * React Query hooks for admin pages.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAdminDashboard,
  listAdminUsers,
  getAdminUser,
  setAdminUserStatus,
  listSystemLogs,
} from '../api/admin'
import {
  listAdminRoleApplications,
  reviewRoleApplication,
} from '../api/role-applications'
import { listAnnouncements } from '../api/announcements'
import type { SystemLogAction } from '../api/dto'

// ---------- Query Keys ----------
export const adminKeys = {
  dashboard: ['admin', 'dashboard'] as const,
  users: (params?: { keyword?: string; role?: string; status?: string; page?: number; pageSize?: number }) =>
    ['admin', 'users', params] as const,
  user: (id: string) => ['admin', 'users', id] as const,
  logs: (params?: { action?: SystemLogAction; from?: string; to?: string; page?: number; pageSize?: number }) =>
    ['admin', 'system-logs', params] as const,
  roleApps: (params?: { status?: string; page?: number; pageSize?: number }) =>
    ['admin', 'role-applications', params] as const,
  announcements: (params?: { page?: number; pageSize?: number }) =>
    ['admin', 'announcements', params] as const,
}

// ---------- Queries ----------

export function useDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: getAdminDashboard,
  })
}

export function useAdminUsers(params?: { keyword?: string; role?: string; status?: 'ACTIVE' | 'DISABLED'; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => listAdminUsers(params),
  })
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.user(id ?? ''),
    queryFn: () => getAdminUser(id!),
    enabled: !!id,
  })
}

export function useSystemLogs(params?: { action?: SystemLogAction; from?: string; to?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: adminKeys.logs(params),
    queryFn: () => listSystemLogs(params),
  })
}

export function useAdminRoleApplications(params?: { status?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: adminKeys.roleApps(params),
    queryFn: () => listAdminRoleApplications(params),
  })
}

export function useAdminAnnouncements(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: adminKeys.announcements(params),
    queryFn: () => listAnnouncements(params),
  })
}

// ---------- Mutations ----------

export function useSetUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status: 'ACTIVE' | 'DISABLED'; reason?: string } }) =>
      setAdminUserStatus(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: adminKeys.user(id) })
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useReviewRoleApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof reviewRoleApplication>[1] }) =>
      reviewRoleApplication(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'role-applications'] })
    },
  })
}
