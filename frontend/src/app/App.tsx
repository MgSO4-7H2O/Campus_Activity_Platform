import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { Route, Routes } from 'react-router-dom'

import ActivityDetailPage from '../modules/activities/ActivityDetailPage'
import ActivityListPage from '../modules/activities/ActivityListPage'
import MyActivitiesPage from '../modules/activities/MyActivitiesPage'
import ActivityApplyPage from '../modules/activity-applications/ActivityApplyPage'
import MyApplicationsPage from '../modules/activity-applications/MyApplicationsPage'
import AdminDashboardPage from '../modules/admin/AdminDashboardPage'
import AdminOrganizationsPage from '../modules/admin/AdminOrganizationsPage'
import AdminSystemLogsPage from '../modules/admin/AdminSystemLogsPage'
import AdminUserDetailPage from '../modules/admin/AdminUserDetailPage'
import AdminUsersPage from '../modules/admin/AdminUsersPage'
import ReviewerDetailPage from '../modules/approval/ReviewerDetailPage'
import ReviewerInboxPage from '../modules/approval/ReviewerInboxPage'
import LoginPage from '../modules/auth/LoginPage'
import RegisterPage from '../modules/auth/RegisterPage'
import CheckinPage from '../modules/checkin/CheckinPage'
import ClosureApplyPage from '../modules/closure/ClosureApplyPage'
import ClosureInboxPage from '../modules/closure/ClosureInboxPage'
import ClosureReviewPage from '../modules/closure/ClosureReviewPage'
import HomePage from '../modules/home/HomePage'
import NotificationCenterPage from '../modules/notifications/NotificationCenterPage'
import OrganizationsPage from '../modules/organizations/OrganizationsPage'
import PermissionApplyPage from '../modules/permissions/PermissionApplyPage'
import ActivityRegisterPage from '../modules/recruitment/ActivityRegisterPage'
import MyRegistrationsPage from '../modules/recruitment/MyRegistrationsPage'
import RecruitmentEditPage from '../modules/recruitment/RecruitmentEditPage'
import RegistrationReviewPage from '../modules/recruitment/RegistrationReviewPage'
import AnnouncementManagePage from '../modules/sysadmin/AnnouncementManagePage'
import RoleApplicationReviewPage from '../modules/sysadmin/RoleApplicationReviewPage'
import TasksPage from '../modules/tasks/TasksPage'
import MeEditPage from '../modules/users/MeEditPage'
import MePage from '../modules/users/MePage'
import MeProfilePage from '../modules/users/MeProfilePage'
import { RequireAuth } from '../shared/auth/guards'
import AppLayout from '../shared/components/AppLayout'

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { borderRadius: 8 } }}>
      <Routes>
        <Route element={<AppLayout />}>
          {/* 公开页面 */}
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="activities" element={<ActivityListPage />} />
          <Route path="activities/:id" element={<ActivityDetailPage />} />
          <Route path="organizations" element={<OrganizationsPage />} />

          {/* 登录后通用页面 */}
          <Route
            path="me"
            element={
              <RequireAuth>
                <MePage />
              </RequireAuth>
            }
          />
          <Route
            path="me/edit"
            element={
              <RequireAuth>
                <MeEditPage />
              </RequireAuth>
            }
          />
          <Route
            path="me/profile"
            element={
              <RequireAuth>
                <MeProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="notifications"
            element={
              <RequireAuth>
                <NotificationCenterPage />
              </RequireAuth>
            }
          />
          <Route
            path="permissions/apply"
            element={
              <RequireAuth>
                <PermissionApplyPage />
              </RequireAuth>
            }
          />
          <Route
            path="tasks"
            element={
              <RequireAuth>
                <TasksPage />
              </RequireAuth>
            }
          />

          {/* ORGANIZER 视角 */}
          <Route
            path="applications"
            element={
              <RequireAuth>
                <MyApplicationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="applications/new"
            element={
              <RequireAuth>
                <ActivityApplyPage />
              </RequireAuth>
            }
          />
          <Route
            path="my/activities"
            element={
              <RequireAuth>
                <MyActivitiesPage />
              </RequireAuth>
            }
          />
          <Route
            path="my/registrations"
            element={
              <RequireAuth>
                <MyRegistrationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="activities/:id/recruitment"
            element={
              <RequireAuth>
                <RecruitmentEditPage />
              </RequireAuth>
            }
          />
          <Route
            path="activities/:id/register"
            element={
              <RequireAuth>
                <ActivityRegisterPage />
              </RequireAuth>
            }
          />
          <Route
            path="activities/:id/registrations"
            element={
              <RequireAuth>
                <RegistrationReviewPage />
              </RequireAuth>
            }
          />
          <Route
            path="activities/:id/checkin"
            element={
              <RequireAuth>
                <CheckinPage />
              </RequireAuth>
            }
          />
          <Route
            path="activities/:id/closure"
            element={
              <RequireAuth>
                <ClosureApplyPage />
              </RequireAuth>
            }
          />

          {/* REVIEWER 视角 */}
          <Route
            path="approvals"
            element={
              <RequireAuth>
                <ReviewerInboxPage />
              </RequireAuth>
            }
          />
          <Route
            path="approvals/:id"
            element={
              <RequireAuth>
                <ReviewerDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="approvals/closures"
            element={
              <RequireAuth>
                <ClosureInboxPage />
              </RequireAuth>
            }
          />
          <Route
            path="closures/:id/review"
            element={
              <RequireAuth>
                <ClosureReviewPage />
              </RequireAuth>
            }
          />

          {/* SYS_ADMIN 视角 */}
          <Route
            path="admin"
            element={
              <RequireAuth>
                <AdminDashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="admin/users"
            element={
              <RequireAuth>
                <AdminUsersPage />
              </RequireAuth>
            }
          />
          <Route
            path="admin/users/:id"
            element={
              <RequireAuth>
                <AdminUserDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="admin/organizations"
            element={
              <RequireAuth>
                <AdminOrganizationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="admin/system-logs"
            element={
              <RequireAuth>
                <AdminSystemLogsPage />
              </RequireAuth>
            }
          />
          <Route
            path="admin/role-applications"
            element={
              <RequireAuth>
                <RoleApplicationReviewPage />
              </RequireAuth>
            }
          />
          <Route
            path="admin/announcements"
            element={
              <RequireAuth>
                <AnnouncementManagePage />
              </RequireAuth>
            }
          />

          {/* 兜底 */}
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </ConfigProvider>
  )
}
