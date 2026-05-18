import {
  ApartmentOutlined,
  AuditOutlined,
  BellOutlined,
  CheckSquareOutlined,
  CrownOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  HomeOutlined,
  InboxOutlined,
  LoginOutlined,
  LogoutOutlined,
  NotificationOutlined,
  ScheduleOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons'
import { Avatar, Badge, Button, Dropdown, Layout, Menu, Select, Space, Typography, theme } from 'antd'
import type { MenuProps } from 'antd'
import { useMemo } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { notifications } from '../mock/data'
import { ROLE_LABELS, useAuthStore } from '../auth/store'

const { Header, Sider, Content } = Layout

type MenuItem = Required<MenuProps>['items'][number]

/** 按角色定义可见菜单。viewRole 为空（未登录或未选）时只能看到首页/登录。*/
function buildMenu(viewRole: string | null, isLoggedIn: boolean): MenuItem[] {
  const items: MenuItem[] = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页 · 公告</Link> },
  ]
  if (!isLoggedIn) {
    items.push(
      { key: '/activities', icon: <UsergroupAddOutlined />, label: <Link to="/activities">活动列表</Link> },
      { key: '/organizations', icon: <ApartmentOutlined />, label: <Link to="/organizations">组织架构</Link> },
      { key: '/login', icon: <LoginOutlined />, label: <Link to="/login">登录</Link> },
      { key: '/register', icon: <SolutionOutlined />, label: <Link to="/register">注册</Link> }
    )
    return items
  }

  // 通用模块：所有登录用户可见
  items.push(
    { key: '/tasks', icon: <InboxOutlined />, label: <Link to="/tasks">我的待办</Link> },
    { key: '/notifications', icon: <BellOutlined />, label: <Link to="/notifications">通知中心</Link> },
    { key: '/permissions/apply', icon: <SolutionOutlined />, label: <Link to="/permissions/apply">权限申请</Link> },
    { key: '/organizations', icon: <ApartmentOutlined />, label: <Link to="/organizations">组织架构</Link> }
  )

  if (viewRole === 'BASIC_USER' || viewRole === 'ORGANIZER') {
    items.push({
      key: 'g-participate',
      icon: <UsergroupAddOutlined />,
      label: '参与活动',
      children: [
        { key: '/activities', label: <Link to="/activities">活动列表</Link> },
        { key: '/my/registrations', label: <Link to="/my/registrations">我的报名</Link> },
      ],
    })
  }

  if (viewRole === 'ORGANIZER') {
    items.push({
      key: 'g-organize',
      icon: <FileTextOutlined />,
      label: '我的活动',
      children: [
        { key: '/applications/new', label: <Link to="/applications/new">活动立项</Link> },
        { key: '/applications', label: <Link to="/applications">我的申请</Link> },
        { key: '/my/activities', label: <Link to="/my/activities">我负责的活动</Link> },
      ],
    })
  }

  if (viewRole === 'REVIEWER') {
    items.push({
      key: 'g-review',
      icon: <AuditOutlined />,
      label: '审核工作台',
      children: [
        { key: '/approvals', label: <Link to="/approvals">立项待办</Link> },
        { key: '/approvals/closures', label: <Link to="/approvals/closures">结项待审</Link> },
      ],
    })
  }

  if (viewRole === 'SYS_ADMIN') {
    items.push({
      key: 'g-admin',
      icon: <CrownOutlined />,
      label: '系统管理',
      children: [
        { key: '/admin', icon: <DashboardOutlined />, label: <Link to="/admin">概览</Link> },
        { key: '/admin/users', icon: <TeamOutlined />, label: <Link to="/admin/users">用户管理</Link> },
        { key: '/admin/organizations', icon: <ApartmentOutlined />, label: <Link to="/admin/organizations">组织管理</Link> },
        { key: '/admin/role-applications', icon: <SolutionOutlined />, label: <Link to="/admin/role-applications">权限申请审核</Link> },
        { key: '/admin/announcements', icon: <NotificationOutlined />, label: <Link to="/admin/announcements">公告管理</Link> },
        { key: '/admin/system-logs', icon: <DatabaseOutlined />, label: <Link to="/admin/system-logs">系统日志</Link> },
      ],
    })
  }

  return items
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, viewRole, logout, setViewRole } = useAuthStore()
  const isLoggedIn = !!user
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [])
  const { token } = theme.useToken()

  const menuItems = buildMenu(viewRole, isLoggedIn)
  const selectedKey = pickSelectedKey(location.pathname)

  const userMenu: MenuProps['items'] = [
    { key: 'me', icon: <UserOutlined />, label: <Link to="/me">个人信息</Link> },
    { key: 'me-edit', icon: <FileSearchOutlined />, label: <Link to="/me/edit">编辑基础信息</Link> },
    { key: 'me-profile', icon: <ScheduleOutlined />, label: <Link to="/me/profile">编辑扩展资料</Link> },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={232} breakpoint="lg" collapsedWidth={0}>
        <div
          style={{
            padding: '20px 16px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <CheckSquareOutlined style={{ fontSize: 22, color: token.colorPrimary }} />
          <div>
            <Typography.Text strong style={{ display: 'block', lineHeight: 1.2 }}>
              校园活动平台
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Campus Activity
            </Typography.Text>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ borderInlineEnd: 'none', paddingTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            height: 56,
          }}
        >
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {pageTitle(location.pathname)}
          </Typography.Text>
          <Space size={16}>
            {isLoggedIn && user && user.roles.length > 1 && (
              <Space size={6}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  当前视图
                </Typography.Text>
                <Select
                  size="small"
                  value={viewRole ?? undefined}
                  style={{ width: 132 }}
                  onChange={(v) => setViewRole(v)}
                  options={user.roles.map((r) => ({ value: r, label: ROLE_LABELS[r] ?? r }))}
                />
              </Space>
            )}
            <Link to="/notifications" aria-label="通知">
              <Badge count={unread} size="small">
                <BellOutlined style={{ fontSize: 18, color: token.colorTextSecondary }} />
              </Badge>
            </Link>
            {isLoggedIn ? (
              <Dropdown menu={{ items: userMenu }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Typography.Text>{user?.realName ?? user?.username}</Typography.Text>
                </Space>
              </Dropdown>
            ) : (
              <Space>
                <Button type="text" onClick={() => navigate('/login')}>
                  登录
                </Button>
                <Button type="primary" onClick={() => navigate('/register')}>
                  注册
                </Button>
              </Space>
            )}
          </Space>
        </Header>
        <Content style={{ padding: 24, background: token.colorBgLayout }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

function pickSelectedKey(pathname: string): string {
  const exact = ['/', '/login', '/register', '/me', '/me/edit', '/me/profile', '/notifications', '/permissions/apply',
    '/applications', '/applications/new', '/activities', '/my/registrations', '/my/activities',
    '/approvals', '/approvals/closures', '/tasks', '/organizations', '/admin', '/admin/users',
    '/admin/organizations', '/admin/role-applications', '/admin/announcements', '/admin/system-logs']
  if (exact.includes(pathname)) return pathname
  if (pathname.startsWith('/admin/users/')) return '/admin/users'
  if (pathname.startsWith('/admin/organizations/')) return '/admin/organizations'
  if (pathname.startsWith('/admin/role-applications/')) return '/admin/role-applications'
  if (pathname.startsWith('/tasks/')) return '/tasks'
  if (pathname.startsWith('/applications/')) return '/applications'
  if (pathname.startsWith('/approvals/closures')) return '/approvals/closures'
  if (pathname.startsWith('/approvals')) return '/approvals'
  if (pathname.startsWith('/activities/') && pathname.endsWith('/registrations')) return '/my/activities'
  if (pathname.startsWith('/activities/') && pathname.endsWith('/checkin')) return '/my/activities'
  if (pathname.startsWith('/activities/') && pathname.endsWith('/recruitment')) return '/my/activities'
  if (pathname.startsWith('/activities/') && pathname.endsWith('/closure')) return '/my/activities'
  if (pathname.startsWith('/activities/') && pathname.endsWith('/register')) return '/activities'
  if (pathname.startsWith('/activities/')) return '/activities'
  return pathname
}

function pageTitle(pathname: string): string {
  const map: Record<string, string> = {
    '/': '首页',
    '/login': '登录',
    '/register': '注册',
    '/me': '个人信息',
    '/me/edit': '编辑基础信息',
    '/me/profile': '编辑扩展资料',
    '/notifications': '通知中心',
    '/permissions/apply': '权限申请',
    '/applications': '我的申请',
    '/applications/new': '活动立项申请',
    '/activities': '活动列表',
    '/approvals': '审核待办',
    '/approvals/closures': '结项待审',
    '/my/registrations': '我的报名',
    '/my/activities': '我负责的活动',
    '/tasks': '我的待办',
    '/organizations': '组织架构',
    '/admin': '系统概览',
    '/admin/users': '用户管理',
    '/admin/organizations': '组织管理',
    '/admin/role-applications': '权限申请审核',
    '/admin/announcements': '公告管理',
    '/admin/system-logs': '系统日志',
  }
  if (pathname.startsWith('/admin/users/')) return '用户详情'
  return map[pathname] ?? '校园活动平台'
}
