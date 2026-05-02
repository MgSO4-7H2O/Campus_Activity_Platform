import { z } from 'zod'

export const updateMeBodySchema = z
  .object({
    realName: z.string().trim().min(1).max(50).optional(),
    phone: z.string().trim().min(3).max(20).optional(),
    email: z.string().trim().email().max(100).optional(),
  })
  .strict()
  .refine((v) => v.realName || v.phone || v.email, {
    message: '至少需要修改一个字段',
  })

export type UpdateMeBody = z.infer<typeof updateMeBodySchema>

export const updateStudentProfileBodySchema = z
  .object({
    college: z.string().trim().min(1).max(100).optional(),
    major: z.string().trim().min(1).max(100).optional(),
    grade: z.number().int().min(1900).max(2100).optional(),
    className: z.string().trim().min(1).max(50).optional(),
  })
  .strict()
  .refine((v) => v.college || v.major || v.grade || v.className, {
    message: '至少需要修改一个字段',
  })

export type UpdateStudentProfileBody = z.infer<typeof updateStudentProfileBodySchema>

export const updateTeacherProfileBodySchema = z
  .object({
    departmentName: z.string().trim().min(1).max(100).optional(),
    jobTitle: z.string().trim().min(1).max(100).optional(),
  })
  .strict()
  .refine((v) => v.departmentName || v.jobTitle, {
    message: '至少需要修改一个字段',
  })

export type UpdateTeacherProfileBody = z.infer<typeof updateTeacherProfileBodySchema>

