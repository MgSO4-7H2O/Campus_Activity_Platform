import { Layout, Menu, Typography } from 'antd'
import { Link, Route, Routes } from 'react-router-dom'

import AdminPage from '../modules/admin'
import AnnouncementsPage from '../modules/announcements'
import ApprovalPage from '../modules/approval'
import AuthPage from '../modules/auth'
import ActivityApplicationsPage from '../modules/activity-applications'
import CheckinPage from '../modules/checkin'
import ClosurePage from '../modules/closure'
import NotificationsPage from '../modules/notifications'
import OrgsPage from '../modules/orgs'
import RecruitmentPage from '../modules/recruitment'

const { Header, Content, Footer } = Layout

function Home() {
  return (
    <div>
      <Typography.Title level={3}>骨架已启动</Typography.Title>
      <Typography.Paragraph>
        现在你们可以按模块逐步实现：申请、审核、招募、签到、结项与通知等功能。
      </Typography.Paragraph>
    </div>
  )
}

export default function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0, marginRight: 16 }}>
          校园活动平台
        </Typography.Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectable={false}
          items={[
            { key: 'home', label: <Link to="/">首页</Link> },
            { key: 'applications', label: <Link to="/activity-applications">活动申请</Link> },
            { key: 'approval', label: <Link to="/approval">审核流转</Link> },
            { key: 'recruitment', label: <Link to="/recruitment">招募报名</Link> },
            { key: 'checkin', label: <Link to="/checkin">签到</Link> },
            { key: 'announcements', label: <Link to="/announcements">新闻通知</Link> },
            { key: 'admin', label: <Link to="/admin">后台配置</Link> },
          ]}
        />
      </Header>

      <Content style={{ padding: 24, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/activity-applications" element={<ActivityApplicationsPage />} />
          <Route path="/approval" element={<ApprovalPage />} />
          <Route path="/recruitment" element={<RecruitmentPage />} />
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/closure" element={<ClosurePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/orgs" element={<OrgsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Content>

      <Footer style={{ textAlign: 'center' }}>Capstone · Campus Activity Platform</Footer>
    </Layout>
  )
}

