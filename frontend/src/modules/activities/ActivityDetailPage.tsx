import { CalendarOutlined, EnvironmentOutlined, ProfileOutlined, TeamOutlined } from '@ant-design/icons'
import { Button, Card, Col, Descriptions, Divider, Empty, Progress, Row, Space, Spin, Typography } from 'antd'
import { Link, useParams } from 'react-router-dom'

import { ActivityStatusTag } from '../../shared/components/StatusTag'
import { useActivity } from '../../shared/hooks/useActivities'

export default function ActivityDetailPage() {
  const { id } = useParams()
  const { data: activity, isLoading } = useActivity(id)

  if (isLoading) {
    return (
      <Card>
        <Spin style={{ display: 'block', textAlign: 'center', padding: 48 }} />
      </Card>
    )
  }

  if (!activity) {
    return (
      <Card>
        <Empty description="未找到该活动" />
      </Card>
    )
  }

  const fillRate = activity.capacity > 0
    ? Math.round((activity.registeredCount / activity.capacity) * 100)
    : 0

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Space>
            <ActivityStatusTag status={activity.status} />
            <Typography.Title level={3} style={{ margin: 0 }}>{activity.title}</Typography.Title>
          </Space>
          <br />
          <Typography.Text type="secondary">{activity.organizationName}</Typography.Text>
        </div>
        <Space>
          {activity.status === 'RECRUITING' && (
            <Link to={`/activities/${activity.id}/register`}>
              <Button type="primary">立即报名</Button>
            </Link>
          )}
          <Link to={`/activities/${activity.id}/checkin`}>
            <Button>签到</Button>
          </Link>
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card>
            <Typography.Title level={5}>活动简介</Typography.Title>
            <Typography.Paragraph>{activity.brief}</Typography.Paragraph>

            <Divider />
            <Descriptions column={2} size="small">
              <Descriptions.Item label={<><CalendarOutlined /> 开始时间</>}>{activity.startAt}</Descriptions.Item>
              <Descriptions.Item label={<><CalendarOutlined /> 结束时间</>}>{activity.endAt}</Descriptions.Item>
              <Descriptions.Item label={<><EnvironmentOutlined /> 地点</>}>{activity.location ?? '—'}</Descriptions.Item>
              <Descriptions.Item label={<><TeamOutlined /> 容量</>}>
                {activity.registeredCount}/{activity.capacity}
              </Descriptions.Item>
              <Descriptions.Item label={<><ProfileOutlined /> 负责人</>}>{activity.organizerName ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="活动状态">
                <ActivityStatusTag status={activity.status} />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="报名信息">
            <Progress percent={fillRate} status={fillRate >= 100 ? 'success' : 'active'} />
            <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
              <Descriptions.Item label="已报名">
                {activity.registeredCount} / {activity.capacity} 人
              </Descriptions.Item>
              <Descriptions.Item label="活动状态">
                <ActivityStatusTag status={activity.status} />
              </Descriptions.Item>
            </Descriptions>
            {activity.status === 'RECRUITING' ? (
              <Link to={`/activities/${activity.id}/register`}>
                <Button type="primary" block style={{ marginTop: 12 }}>去报名</Button>
              </Link>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前未开放报名" />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
