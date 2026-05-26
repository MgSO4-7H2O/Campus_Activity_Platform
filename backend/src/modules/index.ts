import type { Application } from 'express'

import healthRoutes from './health/health.routes.js'
import authRoutes from './auth/auth.routes.js'
import usersRoutes from './users/users.routes.js'
import announcementsRoutes from './announcements/announcements.routes.js'
import activityApplicationsRoutes from './activity-applications/activity-applications.routes.js'
import activitiesRoutes from './activities/activities.routes.js'
import approvalRoutes from './approval/approval.routes.js'
import recruitmentRoutes from './recruitment/recruitment.routes.js'
import signupsRoutes from './signups/signups.routes.js'
import checkinRoutes from './checkin/checkin.routes.js'
import closureRoutes from './closure/closure.routes.js'
import notificationsRoutes from './notifications/notifications.routes.js'
import orgsRoutes from './orgs/orgs.routes.js'
import adminRoutes from './admin/admin.routes.js'
import roleApplicationsRoutes from './role-applications/role-applications.routes.js'
import pendingTasksRoutes from './pending-tasks/pending-tasks.routes.js'

export function registerRoutes(app: Application) {
  app.use('/api/v1', healthRoutes)

  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/users', usersRoutes)
  app.use('/api/v1/announcements', announcementsRoutes)
  app.use('/api/v1', activitiesRoutes)
  app.use('/api/v1/activity-applications', activityApplicationsRoutes)
  app.use('/api/v1', approvalRoutes)
  app.use('/api/v1', recruitmentRoutes)
  app.use('/api/v1', signupsRoutes)
  app.use('/api/v1', checkinRoutes)
  app.use('/api/v1', closureRoutes)
  app.use('/api/v1', pendingTasksRoutes)
  app.use('/api/v1/notifications', notificationsRoutes)
  app.use('/api/v1', orgsRoutes)
  app.use('/api/v1/role-applications', roleApplicationsRoutes)
  app.use('/api/v1/admin', adminRoutes)
}
