import {
  AuditOutlined,
  CalendarOutlined,
  SolutionOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Card, Col, List, Row, Space, Statistic, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { getAdminDashboard } from '../../shared/api/admin'
import type { DashboardSummaryDto, SystemLogAction } from '../../shared/api/dto'
import { fallbackDashboard } from '../../shared/mock/data'

const ACTION_LABEL: Record<SystemLogAction, string> = {
  AUTH_LOGIN: '登录',
  AUTH_REGISTER: '注册',
  ROLE_APPLICATION_SUBMIT: '权限申请提交',
  ROLE_APPLICATION_REVIEW: '权限申请审批',
  ACTIVITY_APPLICATION_SUBMIT: '立项提交',
  ACTIVITY_APPLICATION_REVIEW: '立项审核',
  SIGNUP_REVIEW: '报名审核',
  CHECKIN_OPEN: '签到开启',
  CLOSURE_REVIEW: '结项审核',
  ANNOUNCEMENT_PUBLISH: '公告发布',
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardSummaryDto>(fallbackDashboard)
  const [usingFallback, setUsingFallback] = useState(true)

  useEffect(() => {
    let cancelled = false
    getAdminDashboard()
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setUsingFallback(false)
        }
      })
      .catch(() => {
        // 保留 fallback
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="系统概览" subtitle="管理员仪表盘：用户、活动、审批与日志快览。" />

      {usingFallback && (
        <Typography.Text type="warning" style={{ fontSize: 12 }}>
          当前为 Mock 数据，待后端 <code>/admin/dashboard</code> 上线后自动切换
        </Typography.Text>
      )}

      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="用户总数" value={data.userCount} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="进行中活动"
              value={data.activeActivityCount}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="待审批立项"
              value={data.pendingApprovalCount}
              prefix={<AuditOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="待审批权限申请"
              value={data.pendingRoleApplicationCount}
              prefix={<SolutionOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="近期系统日志"
        extra={<Link to="/admin/system-logs">查看全部 →</Link>}
      >
        <List
          dataSource={data.recentLogs}
          renderItem={(log) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space size={6}>
                    <Tag color="blue">{ACTION_LABEL[log.action]}</Tag>
                    <Typography.Text>
                      {log.actorName ?? '系统'}{' '}
                      {log.resourceType && `→ ${log.resourceType}#${log.resourceId}`}
                    </Typography.Text>
                  </Space>
                }
                description={new Date(log.createdAt).toLocaleString('zh-CN')}
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
