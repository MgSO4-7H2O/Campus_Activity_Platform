import { expect, test } from '@playwright/test'

import {
  bearerHeaders,
  buildRealE2EOrganizationName,
  cleanupCreatedStudent,
  createUniqueActorUsernames,
  createUniqueStudent,
  ensureRealE2EActors,
  loginRealUser,
  readApiData,
  realE2EPassword,
  type CreatedStudent,
} from './real-backend-helpers'

type AuthData = {
  accessToken: string
  user: {
    id: string
    username: string
  }
}

type UserData = {
  id: string
  username: string
}

type OrganizationData = {
  id: string
  name: string
}

type RoleApplicationData = {
  id: string
  appliedRole: string
  organizationId: string
  status: string
}

type ActivityApplicationData = {
  id: string
  title: string
  organizationId: string
  organizerId: string
  status: string
  currentApprovalLevel: number
}

type ActivityData = {
  id: string
  title: string
  applicationId: string
  organizationId: string
  organizerId: string
  status: string
}

type ApprovalRecordData = {
  id: string
  applicationId: string
  decision: string
  comment: string | null
}

test('真实后端和 PostgreSQL 支持权限申请、立项审核和活动生成主链路', async ({ request }) => {
  const student = createUniqueStudent()
  const actors = createUniqueActorUsernames()
  let createdStudent: CreatedStudent | null = null
  let createdAdmin: CreatedStudent | null = null
  let createdReviewer: CreatedStudent | null = null

  try {
    const ensuredActors = ensureRealE2EActors(actors)
    createdAdmin = {
      username: ensuredActors.adminUsername,
      password: realE2EPassword,
    }
    createdReviewer = {
      username: ensuredActors.reviewerUsername,
      password: realE2EPassword,
    }

    const registration = await readApiData<AuthData>(
      await request.post('http://localhost:3100/api/v1/auth/register', {
        data: {
          username: student.username,
          password: realE2EPassword,
          userType: 'student',
          realName: student.realName,
          email: student.email,
          phone: student.phone,
        },
      }),
      201
    )
    createdStudent = {
      username: student.username,
      password: realE2EPassword,
    }

    const adminToken = await loginRealUser(request, ensuredActors.adminUsername)
    const reviewerToken = await loginRealUser(request, ensuredActors.reviewerUsername)
    const reviewer = await readApiData<UserData>(
      await request.get('http://localhost:3100/api/v1/users/me', {
        headers: bearerHeaders(reviewerToken),
      }),
      200
    )

    const organization = await readApiData<OrganizationData>(
      await request.post('http://localhost:3100/api/v1/admin/organizations', {
        headers: bearerHeaders(adminToken),
        data: {
          name: buildRealE2EOrganizationName(student.username),
          type: 'club',
          description: '真实联调主链路测试组织',
        },
      }),
      201
    )

    await readApiData<unknown>(
      await request.post(`http://localhost:3100/api/v1/admin/users/${reviewer.id}/organizations`, {
        headers: bearerHeaders(adminToken),
        data: {
          organizationId: organization.id,
          role: 'REVIEWER',
        },
      }),
      201
    )

    const roleApplication = await readApiData<RoleApplicationData>(
      await request.post('http://localhost:3100/api/v1/role-applications', {
        headers: bearerHeaders(registration.accessToken),
        data: {
          appliedRole: 'ORGANIZER',
          organizationId: organization.id,
          reason: '真实联调申请成为活动负责人',
        },
      }),
      201
    )
    expect(roleApplication.status).toBe('SUBMITTED')

    const reviewedRoleApplication = await readApiData<RoleApplicationData>(
      await request.post(`http://localhost:3100/api/v1/admin/role-applications/${roleApplication.id}/review`, {
        headers: bearerHeaders(adminToken),
        data: {
          decision: 'APPROVE',
          comment: '真实联调通过权限申请',
        },
      }),
      200
    )
    expect(reviewedRoleApplication.status).toBe('APPROVED')

    const roles = await readApiData<string[]>(
      await request.get('http://localhost:3100/api/v1/users/me/roles', {
        headers: bearerHeaders(registration.accessToken),
      }),
      200
    )
    expect(roles).toContain('ORGANIZER')

    const title = `真实联调立项-${student.username}`
    const activityApplication = await readApiData<ActivityApplicationData>(
      await request.post('http://localhost:3100/api/v1/activity-applications', {
        headers: bearerHeaders(registration.accessToken),
        data: {
          title,
          organizationId: organization.id,
          brief: '真实联调活动主链路测试，验证立项申请提交、审核通过和活动自动生成。',
          expectedStart: '2026-07-01T01:00:00.000Z',
          expectedEnd: '2026-07-01T03:00:00.000Z',
          expectedScale: 30,
          budget: 1000,
          location: '真实联调报告厅',
        },
      }),
      201
    )

    const submittedApplication = await readApiData<ActivityApplicationData>(
      await request.post(`http://localhost:3100/api/v1/activity-applications/${activityApplication.id}/submit`, {
        headers: bearerHeaders(registration.accessToken),
      }),
      200
    )
    expect(submittedApplication.status).toBe('APPROVING')
    expect(submittedApplication.currentApprovalLevel).toBe(1)

    const reviewerDetail = await readApiData<ActivityApplicationData>(
      await request.get(`http://localhost:3100/api/v1/approval/activity-applications/${activityApplication.id}`, {
        headers: bearerHeaders(reviewerToken),
      }),
      200
    )
    expect(reviewerDetail.id).toBe(activityApplication.id)

    const approvedApplication = await readApiData<ActivityApplicationData>(
      await request.post(`http://localhost:3100/api/v1/approval/activity-applications/${activityApplication.id}/review`, {
        headers: bearerHeaders(reviewerToken),
        data: {
          decision: 'APPROVE',
          comment: '真实联调审核通过',
        },
      }),
      200
    )
    expect(approvedApplication.status).toBe('APPROVED')

    const activities = await readApiData<ActivityData[]>(
      await request.get('http://localhost:3100/api/v1/activities/me', {
        headers: bearerHeaders(registration.accessToken),
      }),
      200
    )
    const generatedActivity = activities.find((activity) => activity.applicationId === activityApplication.id)
    expect(generatedActivity).toEqual(expect.objectContaining({
      title,
      status: 'PLANNED',
      organizationId: organization.id,
      organizerId: registration.user.id,
    }))

    const approvalRecords = await readApiData<ApprovalRecordData[]>(
      await request.get(`http://localhost:3100/api/v1/activity-applications/${activityApplication.id}/approval-records`, {
        headers: bearerHeaders(registration.accessToken),
      }),
      200
    )
    expect(approvalRecords).toEqual([
      expect.objectContaining({
        applicationId: activityApplication.id,
        decision: 'APPROVE',
        comment: '真实联调审核通过',
      }),
    ])
  } finally {
    if (createdStudent) {
      await cleanupCreatedStudent(request, createdStudent)
    }
    if (createdReviewer) {
      await cleanupCreatedStudent(request, createdReviewer)
    }
    if (createdAdmin) {
      await cleanupCreatedStudent(request, createdAdmin)
    }
  }
})
