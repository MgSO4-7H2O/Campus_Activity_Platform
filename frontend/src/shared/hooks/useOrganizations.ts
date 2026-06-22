/**
 * React Query hooks for organizations.
 */
import { useQuery } from '@tanstack/react-query'
import {
  listOrganizations,
  getOrganizationTree,
  getOrganization,
} from '../api/organizations'
import type { OrganizationNode } from '../api/dto'

// ---------- Query Keys ----------
export const orgKeys = {
  list: (params?: { type?: string; status?: string }) => ['organizations', params] as const,
  tree: ['organizations', 'tree'] as const,
  detail: (id: string) => ['organizations', id] as const,
}

// ---------- Queries ----------

export function useOrganizations(params?: { type?: string; status?: string }) {
  return useQuery({
    queryKey: orgKeys.list(params),
    queryFn: () => listOrganizations(params),
  })
}

export function useOrgTree() {
  return useQuery<OrganizationNode[]>({
    queryKey: orgKeys.tree,
    queryFn: getOrganizationTree,
  })
}

export function useOrganization(id: string | undefined) {
  return useQuery({
    queryKey: orgKeys.detail(id ?? ''),
    queryFn: () => getOrganization(id!),
    enabled: !!id,
  })
}
