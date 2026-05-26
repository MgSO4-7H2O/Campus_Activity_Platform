import { z } from 'zod'

export const organizationTypeSchema = z.enum([
  'club',
  'student_organization',
  'administration',
  'department',
])

export const organizationStatusSchema = z.enum(['ACTIVE', 'DISABLED'])

export const listOrganizationsQuerySchema = z.object({
  type: organizationTypeSchema.optional(),
  status: organizationStatusSchema.optional(),
})

export const createOrganizationSchema = z.object({
  name: z.string().min(1),
  type: organizationTypeSchema,
  parentOrgId: z.string().uuid().optional(),
  description: z.string().optional(),
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  type: organizationTypeSchema.optional(),
  parentOrgId: z.string().uuid().optional(),
  description: z.string().optional(),
  status: organizationStatusSchema.optional(),
})

export const addUserOrganizationSchema = z.object({
  organizationId: z.string().uuid(),
  role: z.enum(['ORGANIZER', 'REVIEWER', 'MEMBER']).optional(),
})
