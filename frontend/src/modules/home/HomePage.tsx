import { CalendarOutlined, NotificationOutlined, PushpinOutlined, RightOutlined, TeamOutlined } from '@ant-design/icons'
import { Card, Col, List, Row, Space, Statistic, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'

import { activities, announcements, notifications } from '../../shared/mock/data'
import { ActivityStatusTag } from '../../shared/components/StatusTag'
import PageHeader from '../../shared/components/PageHeader'
import { useAuthStore } from '../../shared/auth/store'

const CATEGORY_COLOR: Record<string, string> = { 新闻: 'cyan', 通知: 'blue', 活动: 'green' }

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const ongoing = activities.filter((a) => a.status === 'recruiting' || a.status === 'ongoing')
  const unread = notifications.filter((n) => !n.read).length

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={user ? `${user.realName ?? user.username}，欢迎回来` : '校园活动平台'}
        subtitle="活动立项 · 招募报名 · 签到结项 · 全流程在线协同"
      />

      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="进行中活动" value={activities.filter((a) => a.status === 'ongoing').length} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="正在招募" value={activities.filter((a) => a.status === 'recruiting').length} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="未读通知" value={unread} prefix={<NotificationOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="本月公告" value={announcements.length} prefix={<PushpinOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card
            title="最新公告"
            extra={
              <Link to="/notifications">
                查看全部 <RightOutlined />
              </Link>
            }
          >
            <List
              dataSource={announcements}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Tag color={CATEGORY_COLOR[item.category] ?? 'default'} style={{ marginInline: 0 }}>
                        {item.category}
                      </Tag>
                    }
                    title={
                      <Space>
                        {item.pinned && <Tag color="red">置顶</Tag>}
                        <Typography.Text strong>{item.title}</Typography.Text>
                      </Space>
                    }
                    description={
                      <>
                        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                          {item.author} · {item.publishedAt}
                        </Typography.Text>
                        <Typography.Paragraph style={{ marginBottom: 0 }}>{item.excerpt}</Typography.Paragraph>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="正在进行 / 招募中"
            extra={
              <Link to="/activities">
                查看全部 <RightOutlined />
              </Link>
            }
          >
            <List
              dataSource={ongoing}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Link key="detail" to={`/activities/${item.id}`}>
                      查看详情
                    </Link>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <ActivityStatusTag status={item.status} />
                        <Typography.Text strong>{item.title}</Typography.Text>
                      </Space>
                    }
                    description={
                      <Space size={12} wrap>
                        <Typography.Text type="secondary">{item.organizationName}</Typography.Text>
                        <Typography.Text type="secondary">{item.startAt}</Typography.Text>
                        <Typography.Text type="secondary">
                          {item.registered}/{item.capacity} 人
                        </Typography.Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
