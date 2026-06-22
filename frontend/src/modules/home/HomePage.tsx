import { CalendarOutlined, NotificationOutlined, PushpinOutlined, RightOutlined, TeamOutlined } from '@ant-design/icons'
import { Card, Col, List, Row, Space, Spin, Statistic, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'

import { ActivityStatusTag } from '../../shared/components/StatusTag'
import { useActivities } from '../../shared/hooks/useActivities'
import { useUnreadCount } from '../../shared/hooks/useNotifications'
import { useAnnouncements } from '../../shared/hooks/useAnnouncements'
import { useAuthStore } from '../../shared/auth/store'
import type { ActivityDto, AnnouncementDto, AnnouncementCategory } from '../../shared/api/dto'

const CATEGORY_LABEL: Record<AnnouncementCategory, string> = {
  NEWS: '新闻',
  NOTICE: '通知',
  RECRUITMENT: '招募',
  SYSTEM: '系统',
}

const CATEGORY_COLOR: Record<AnnouncementCategory, string> = {
  NEWS: 'cyan',
  NOTICE: 'blue',
  RECRUITMENT: 'green',
  SYSTEM: 'orange',
}

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const { data: activityPage, isLoading: loadingActivities } = useActivities()
  const { data: unreadCount = 0 } = useUnreadCount()
  const { data: announcementPage, isLoading: loadingAnnouncements } = useAnnouncements()

  const allActivities = activityPage?.items ?? []
  const ongoingCount = allActivities.filter((a: ActivityDto) => a.status === 'ONGOING').length
  const recruitingCount = allActivities.filter((a: ActivityDto) => a.status === 'RECRUITING').length
  const ongoing = allActivities.filter((a: ActivityDto) => a.status === 'RECRUITING' || a.status === 'ONGOING').slice(0, 5)
  const announcements: AnnouncementDto[] = (announcementPage?.items ?? [])
    .filter((a: AnnouncementDto) => a.status === 'PUBLISHED')
    .slice(0, 5)

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {user ? `${user.realName ?? user.username}，欢迎回来` : '校园活动平台'}
        </Typography.Title>
        <Typography.Text type="secondary">
          活动立项 · 招募报名 · 签到结项 · 全流程在线协同
        </Typography.Text>
      </div>

      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card>
            <Spin spinning={loadingActivities}>
              <Statistic title="进行中活动" value={ongoingCount} prefix={<CalendarOutlined />} />
            </Spin>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Spin spinning={loadingActivities}>
              <Statistic title="正在招募" value={recruitingCount} prefix={<TeamOutlined />} />
            </Spin>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="未读通知" value={unreadCount} prefix={<NotificationOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Spin spinning={loadingAnnouncements}>
              <Statistic title="公告" value={announcementPage?.total ?? 0} prefix={<PushpinOutlined />} />
            </Spin>
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
            <Spin spinning={loadingAnnouncements}>
              {announcements.length === 0 ? (
                <Typography.Text type="secondary">暂无公告</Typography.Text>
              ) : (
                <List
                  dataSource={announcements}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Tag color={CATEGORY_COLOR[item.category]}>
                            {CATEGORY_LABEL[item.category]}
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
                              {item.authorName ?? '—'} · {item.publishedAt ?? item.createdAt}
                            </Typography.Text>
                            <Typography.Paragraph style={{ marginBottom: 0 }} ellipsis={{ rows: 2 }}>
                              {item.content}
                            </Typography.Paragraph>
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Spin>
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
            <Spin spinning={loadingActivities}>
              {ongoing.length === 0 ? (
                <Typography.Text type="secondary">暂无活动</Typography.Text>
              ) : (
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
                              {item.registeredCount}/{item.capacity} 人
                            </Typography.Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Spin>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
