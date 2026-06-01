import { performance } from 'node:perf_hooks'
import request, { type Response } from 'supertest'
import type { Application } from 'express'

import { createApp } from '../app.js'
import prisma from '../shared/prisma/client.js'
import { ensureCoreRoles, grantRole } from '../test/fixtures.js'
import {
  assertScenarioWithinThreshold,
  summarizeScenarioResult,
  type ScenarioMeasurement,
  type ScenarioResult,
} from './perf-metrics.js'

type PerfUser = {
  id: string
  username: string
  password: string
  accessToken: string
}

type PerfActivitySeed = {
  organizationId: string
  activityId: string
  recruitmentId: string
}

type PerfCheckinSeed = {
  sessionId: string
  code: string
}

type PerfSeed = PerfActivitySeed & {
  runKey: string
  dataPrefix: string
  organizer: PerfUser
  participants: PerfUser[]
}

type RegisterPerfUserInput = {
  username: string
  realName: string
}

type CleanupScope = {
  dataPrefix: string
  usernamePrefix: string
  orgCodePrefix: string
}

const PARTICIPANT_COUNT = 16
const QUERY_REQUEST_COUNT = 20
const AUTH_REQUEST_COUNT = 10
const P95_THRESHOLD_MS = 3000
const PASSWORD = 'Password123!'

function buildRunKey(): string {
  return `p${Date.now().toString(36).slice(-8)}`
}

function assertStatus(response: Response, expectedStatus: number, context: string): void {
  if (response.status !== expectedStatus) {
    throw new Error(`${context} failed: status=${response.status}, body=${response.text}`)
  }
}

async function measureOperation(operation: () => Promise<boolean>): Promise<ScenarioMeasurement> {
  const startedAt = performance.now()
  const ok = await operation()
  const endedAt = performance.now()

  return {
    latencyMs: Math.round(endedAt - startedAt),
    ok,
  }
}

async function measureConcurrentOperations(
  operations: Array<() => Promise<boolean>>
): Promise<ScenarioMeasurement[]> {
  return Promise.all(operations.map((operation) => measureOperation(operation)))
}

async function registerPerfUser(app: Application, input: RegisterPerfUserInput): Promise<PerfUser> {
  const response = await request(app).post('/api/v1/auth/register').send({
    username: input.username,
    password: PASSWORD,
    userType: 'student',
    realName: input.realName,
  })

  assertStatus(response, 201, `Register perf user ${input.username}`)

  return {
    id: response.body.data.user.id as string,
    username: input.username,
    password: PASSWORD,
    accessToken: response.body.data.accessToken as string,
  }
}

async function createPerfUsers(app: Application, usernamePrefix: string): Promise<{
  organizer: PerfUser
  participants: PerfUser[]
}> {
  const organizer = await registerPerfUser(app, {
    username: `${usernamePrefix}_org`,
    realName: '性能测试负责人',
  })
  await grantRole(organizer.id, 'ORGANIZER')

  const participantInputs = Array.from({ length: PARTICIPANT_COUNT }, (_value, index) => ({
    username: `${usernamePrefix}_${String(index + 1).padStart(2, '0')}`,
    realName: `性能测试用户${index + 1}`,
  }))

  const participants = await Promise.all(
    participantInputs.map((input) => registerPerfUser(app, input))
  )

  return { organizer, participants }
}

async function createPerfActivitySeed(seed: {
  dataPrefix: string
  organizerId: string
}): Promise<PerfActivitySeed> {
  const organization = await prisma.organization.create({
    data: {
      orgCode: seed.dataPrefix.toUpperCase().slice(0, 30),
      name: `${seed.dataPrefix} 性能测试组织`,
      type: 'CLUB',
      status: 'ACTIVE',
    },
  })

  const application = await prisma.activityApplication.create({
    data: {
      applicantId: seed.organizerId,
      organizationId: organization.id,
      title: `${seed.dataPrefix} 性能测试立项`,
      summary: 'Performance smoke activity application',
      startTime: new Date(Date.now() - 60 * 60 * 1000),
      endTime: new Date(Date.now() + 60 * 60 * 1000),
      status: 'APPROVED',
    },
  })

  const activity = await prisma.activity.create({
    data: {
      applicationId: application.id,
      title: `${seed.dataPrefix} 性能测试活动`,
      organizerId: seed.organizerId,
      organizationId: organization.id,
      startTime: new Date(Date.now() - 60 * 60 * 1000),
      endTime: new Date(Date.now() + 60 * 60 * 1000),
      status: 'RECRUITING',
      publishedAt: new Date(),
    },
  })

  const recruitment = await prisma.recruitment.create({
    data: {
      activityId: activity.id,
      title: `${seed.dataPrefix} 性能测试招募`,
      quota: PARTICIPANT_COUNT,
      signupStartTime: new Date(Date.now() - 60 * 60 * 1000),
      signupEndTime: new Date(Date.now() + 60 * 60 * 1000),
      targetUserType: 'STUDENT',
      requiresAttachment: false,
      status: 'PUBLISHED',
    },
  })

  return {
    organizationId: organization.id,
    activityId: activity.id,
    recruitmentId: recruitment.id,
  }
}

async function preparePerfSeed(app: Application, runKey: string): Promise<PerfSeed> {
  const dataPrefix = `perf_${runKey}`
  const usernamePrefix = `perf${runKey}`
  await ensureCoreRoles()
  const users = await createPerfUsers(app, usernamePrefix)
  const activitySeed = await createPerfActivitySeed({
    dataPrefix,
    organizerId: users.organizer.id,
  })

  return {
    runKey,
    dataPrefix,
    organizer: users.organizer,
    participants: users.participants,
    ...activitySeed,
  }
}

async function cleanupPerfData(scope: CleanupScope): Promise<void> {
  const users = await prisma.user.findMany({
    where: { username: { startsWith: scope.usernamePrefix } },
    select: { id: true },
  })
  const userIds = users.map((user) => user.id)

  const organizations = await prisma.organization.findMany({
    where: { orgCode: { startsWith: scope.orgCodePrefix } },
    select: { id: true },
  })
  const organizationIds = organizations.map((organization) => organization.id)

  const activityApplications = await prisma.activityApplication.findMany({
    where: {
      OR: [
        { applicantId: { in: userIds } },
        { organizationId: { in: organizationIds } },
        { title: { startsWith: scope.dataPrefix } },
      ],
    },
    select: { id: true },
  })
  const activityApplicationIds = activityApplications.map((application) => application.id)

  const activities = await prisma.activity.findMany({
    where: {
      OR: [
        { organizerId: { in: userIds } },
        { organizationId: { in: organizationIds } },
        { applicationId: { in: activityApplicationIds } },
        { title: { startsWith: scope.dataPrefix } },
      ],
    },
    select: { id: true },
  })
  const activityIds = activities.map((activity) => activity.id)

  const recruitments = await prisma.recruitment.findMany({
    where: { activityId: { in: activityIds } },
    select: { id: true },
  })
  const recruitmentIds = recruitments.map((recruitment) => recruitment.id)

  const signups = await prisma.recruitmentSignup.findMany({
    where: {
      OR: [{ userId: { in: userIds } }, { recruitmentId: { in: recruitmentIds } }],
    },
    select: { id: true },
  })
  const signupIds = signups.map((signup) => signup.id)

  const sessions = await prisma.checkinSession.findMany({
    where: {
      OR: [{ activityId: { in: activityIds } }, { createdBy: { in: userIds } }],
    },
    select: { id: true },
  })
  const sessionIds = sessions.map((session) => session.id)

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { createdBy: { in: userIds } },
        { sourceId: { in: [...activityIds, ...signupIds] } },
      ],
    },
    select: { id: true },
  })
  const notificationIds = notifications.map((notification) => notification.id)

  await prisma.notificationReceipt.deleteMany({
    where: {
      OR: [{ userId: { in: userIds } }, { notificationId: { in: notificationIds } }],
    },
  })
  await prisma.notification.deleteMany({ where: { id: { in: notificationIds } } })
  await prisma.systemLog.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.pendingTask.deleteMany({
    where: {
      OR: [
        { assigneeId: { in: userIds } },
        { createdBy: { in: userIds } },
        { relatedResourceId: { in: [...signupIds, ...activityApplicationIds] } },
      ],
    },
  })
  await prisma.checkinRecord.deleteMany({
    where: {
      OR: [
        { sessionId: { in: sessionIds } },
        { activityId: { in: activityIds } },
        { userId: { in: userIds } },
      ],
    },
  })
  await prisma.checkinSession.deleteMany({ where: { id: { in: sessionIds } } })
  await prisma.signupAttachment.deleteMany({ where: { signupId: { in: signupIds } } })
  await prisma.recruitmentSignup.deleteMany({ where: { id: { in: signupIds } } })
  await prisma.recruitmentAllowedMajor.deleteMany({
    where: { recruitmentId: { in: recruitmentIds } },
  })
  await prisma.recruitment.deleteMany({ where: { id: { in: recruitmentIds } } })
  await prisma.activity.deleteMany({ where: { id: { in: activityIds } } })
  await prisma.approvalRecord.deleteMany({
    where: { activityApplicationId: { in: activityApplicationIds } },
  })
  await prisma.applicationAttachment.deleteMany({
    where: { applicationId: { in: activityApplicationIds } },
  })
  await prisma.roleApplication.deleteMany({
    where: {
      OR: [{ applicantId: { in: userIds } }, { organizationId: { in: organizationIds } }],
    },
  })
  await prisma.activityApplication.deleteMany({
    where: { id: { in: activityApplicationIds } },
  })
  await prisma.userOrganization.deleteMany({
    where: {
      OR: [{ userId: { in: userIds } }, { organizationId: { in: organizationIds } }],
    },
  })
  await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.studentProfile.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.teacherProfile.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.organization.deleteMany({ where: { id: { in: organizationIds } } })
}

async function verifyCleanup(scope: CleanupScope): Promise<void> {
  const userCount = await prisma.user.count({
    where: { username: { startsWith: scope.usernamePrefix } },
  })
  const organizationCount = await prisma.organization.count({
    where: { orgCode: { startsWith: scope.orgCodePrefix } },
  })
  const activityCount = await prisma.activity.count({
    where: { title: { startsWith: scope.dataPrefix } },
  })

  if (userCount !== 0 || organizationCount !== 0 || activityCount !== 0) {
    throw new Error(
      `Performance cleanup failed: users=${userCount}, organizations=${organizationCount}, activities=${activityCount}`
    )
  }
}

function createCleanupScope(runKey: string): CleanupScope {
  return {
    dataPrefix: `perf_${runKey}`,
    usernamePrefix: `perf${runKey}`,
    orgCodePrefix: `PERF_${runKey.toUpperCase()}`,
  }
}

async function runAuthScenario(app: Application, user: PerfUser): Promise<ScenarioResult> {
  const measurements = await measureConcurrentOperations(
    Array.from({ length: AUTH_REQUEST_COUNT }, () => async () => {
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        username: user.username,
        password: user.password,
      })
      if (loginResponse.status !== 200) {
        return false
      }

      const token = loginResponse.body.data.accessToken as string
      const meResponse = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
      return meResponse.status === 200 && meResponse.body.data.username === user.username
    })
  )

  return summarizeScenarioResult({
    name: '登录与当前用户信息',
    thresholdP95Ms: P95_THRESHOLD_MS,
    measurements,
  })
}

async function runActivityQueryScenario(app: Application): Promise<ScenarioResult> {
  const measurements = await measureConcurrentOperations(
    Array.from({ length: QUERY_REQUEST_COUNT }, () => async () => {
      const response = await request(app).get('/api/v1/activities').query({
        status: 'RECRUITING',
        page: '1',
        pageSize: '10',
      })
      return response.status === 200 && Array.isArray(response.body.data)
    })
  )

  return summarizeScenarioResult({
    name: '常规活动列表查询',
    thresholdP95Ms: P95_THRESHOLD_MS,
    measurements,
  })
}

async function runSignupPeakScenario(app: Application, seed: PerfSeed): Promise<ScenarioResult> {
  const measurements = await measureConcurrentOperations(
    seed.participants.map((participant) => async () => {
      const response = await request(app)
        .post(`/api/v1/recruitments/${seed.recruitmentId}/signups`)
        .set('Authorization', `Bearer ${participant.accessToken}`)
        .send({})
      return response.status === 201
    })
  )

  const signupCount = await prisma.recruitmentSignup.count({
    where: { recruitmentId: seed.recruitmentId },
  })
  const pendingTaskCount = await prisma.pendingTask.count({
    where: {
      taskType: 'SIGNUP_REVIEW',
      relatedResourceType: 'RECRUITMENT_SIGNUP',
      createdBy: { in: seed.participants.map((participant) => participant.id) },
    },
  })

  if (signupCount !== seed.participants.length || pendingTaskCount !== seed.participants.length) {
    throw new Error(
      `Signup consistency failed: signups=${signupCount}, pendingTasks=${pendingTaskCount}, expected=${seed.participants.length}`
    )
  }

  return summarizeScenarioResult({
    name: '报名高峰',
    thresholdP95Ms: P95_THRESHOLD_MS,
    measurements,
  })
}

async function approveAllPerfSignups(seed: PerfSeed): Promise<void> {
  await prisma.recruitmentSignup.updateMany({
    where: { recruitmentId: seed.recruitmentId },
    data: {
      status: 'APPROVED',
      reviewedBy: seed.organizer.id,
      reviewedAt: new Date(),
    },
  })
}

async function createAndOpenCheckinSession(app: Application, seed: PerfSeed): Promise<PerfCheckinSeed> {
  const startedAt = new Date(Date.now() - 60 * 1000).toISOString()
  const endedAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const createResponse = await request(app)
    .post('/api/v1/checkin-sessions')
    .set('Authorization', `Bearer ${seed.organizer.accessToken}`)
    .send({
      activityId: seed.activityId,
      title: `${seed.dataPrefix} 性能测试签到`,
      method: 'CODE',
      startAt: startedAt,
      endAt: endedAt,
    })

  assertStatus(createResponse, 201, 'Create perf checkin session')

  const sessionId = createResponse.body.data.id as string
  const code = createResponse.body.data.code as string
  const openResponse = await request(app)
    .post(`/api/v1/checkin-sessions/${sessionId}/open`)
    .set('Authorization', `Bearer ${seed.organizer.accessToken}`)

  assertStatus(openResponse, 200, 'Open perf checkin session')

  return { sessionId, code }
}

async function runCheckinPeakScenario(
  app: Application,
  seed: PerfSeed,
  checkinSeed: PerfCheckinSeed
): Promise<ScenarioResult> {
  const measurements = await measureConcurrentOperations(
    seed.participants.map((participant) => async () => {
      const response = await request(app)
        .post(`/api/v1/checkin-sessions/${checkinSeed.sessionId}/checkin`)
        .set('Authorization', `Bearer ${participant.accessToken}`)
        .send({ code: checkinSeed.code })
      return response.status === 200
    })
  )

  const recordCount = await prisma.checkinRecord.count({
    where: { sessionId: checkinSeed.sessionId },
  })
  if (recordCount !== seed.participants.length) {
    throw new Error(`Checkin consistency failed: records=${recordCount}, expected=${seed.participants.length}`)
  }

  const duplicateResponse = await request(app)
    .post(`/api/v1/checkin-sessions/${checkinSeed.sessionId}/checkin`)
    .set('Authorization', `Bearer ${seed.participants[0].accessToken}`)
    .send({ code: checkinSeed.code })
  assertStatus(duplicateResponse, 409, 'Duplicate perf checkin')

  return summarizeScenarioResult({
    name: '签到高峰',
    thresholdP95Ms: P95_THRESHOLD_MS,
    measurements,
  })
}

function printScenarioResults(results: ScenarioResult[]): void {
  const rows = results.map((result) => ({
    scenario: result.name,
    count: result.count,
    failed: result.failed,
    p50Ms: result.p50Ms,
    p95Ms: result.p95Ms,
    maxMs: result.maxMs,
    thresholdP95Ms: result.thresholdP95Ms,
  }))

  console.table(rows)
}

async function runPerformanceSmoke(): Promise<void> {
  const app = createApp()
  const runKey = buildRunKey()
  const cleanupScope = createCleanupScope(runKey)

  await cleanupPerfData(cleanupScope)

  try {
    const seed = await preparePerfSeed(app, runKey)
    const authResult = await runAuthScenario(app, seed.participants[0])
    const queryResult = await runActivityQueryScenario(app)
    const signupResult = await runSignupPeakScenario(app, seed)
    await approveAllPerfSignups(seed)
    const checkinSeed = await createAndOpenCheckinSession(app, seed)
    const checkinResult = await runCheckinPeakScenario(app, seed, checkinSeed)
    const results = [authResult, queryResult, signupResult, checkinResult]

    results.forEach((result) => assertScenarioWithinThreshold(result))
    printScenarioResults(results)
  } finally {
    await cleanupPerfData(cleanupScope)
    await verifyCleanup(cleanupScope)
  }
}

try {
  await runPerformanceSmoke()
} finally {
  await prisma.$disconnect()
}
