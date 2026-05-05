import { CalendarOutlined, EnvironmentOutlined, ProfileOutlined, TeamOutlined } from '@ant-design/icons'
import { Button, Card, Col, Descriptions, Divider, Empty, Progress, Row, Space, Tag, Typography } from 'antd'
import { Link, useParams } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { ActivityStatusTag, RecruitmentStatusTag } from '../../shared/components/StatusTag'
import { activities, recruitments } from '../../shared/mock/data'

export default function ActivityDetailPage() {
  const { id } = useParams()
  const activity = activities.find((a) => a.id === id)
  const recruitment = id ? recruitments[id] : undefined

  if (!activity) {
    return (
      <Card>
        <Empty description="未找到该活动" />
      </Card>
    )
  }

  const fillRate = Math.round((activity.registered / activity.capacity) * 100)

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={
          <Space>
            <ActivityStatusTag status={activity.status} />
            {activity.title}
          </Space>
        }
        subtitle={activity.organizationName}
        extra={
          <>
            {recruitment?.status === 'published' && (
              <Link to={`/activities/${activity.id}/register`}>
                <Button type="primary">立即报名</Button>
              </Link>
            )}
            <Link to={`/activities/${activity.id}/checkin`}>
              <Button>签到</Button>
            </Link>
          </>
        }
      />

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card>
            <Typography.Title level={5}>活动简介</Typography.Title>
            <Typography.Paragraph>{activity.brief}</Typography.Paragraph>

            <Divider />
            <Descriptions column={2} size="small">
              <Descriptions.Item label={<><CalendarOutlined /> 开始时间</>}>{activity.startAt}</Descriptions.Item>
              <Descriptions.Item label={<><CalendarOutlined /> 结束时间</>}>{activity.endAt}</Descriptions.Item>
              <Descriptions.Item label={<><EnvironmentOutlined /> 地点</>}>{activity.location}</Descriptions.Item>
              <Descriptions.Item label={<><TeamOutlined /> 容量</>}>
                {activity.registered}/{activity.capacity}
              </Descriptions.Item>
              <Descriptions.Item label={<><ProfileOutlined /> 负责人</>}>{activity.organizerName}</Descriptions.Item>
              <Descriptions.Item label="活动状态">
                <ActivityStatusTag status={activity.status} />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="招募信息">
            {recruitment ? (
              <>
                <Space style={{ marginBottom: 8 }}>
                  <RecruitmentStatusTag status={recruitment.status} />
                </Space>
                <Progress percent={fillRate} status={fillRate >= 100 ? 'success' : 'active'} />
                <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
                  <Descriptions.Item label="报名时间">
                    {recruitment.registrationStart} ~ {recruitment.registrationEnd}
                  </Descriptions.Item>
                  <Descriptions.Item label="可报名身份">
                    {recruitment.userTypes.map((t) => (
                      <Tag key={t}>{t === 'STUDENT' ? '学生' : '教师'}</Tag>
                    ))}
                  </Descriptions.Item>
                  {recruitment.gradeLimit && (
                    <Descriptions.Item label="年级限制">
                      {recruitment.gradeLimit.map((g) => (
                        <Tag key={g}>{g}</Tag>
                      ))}
                    </Descriptions.Item>
                  )}
                  {recruitment.majorLimit && (
                    <Descriptions.Item label="专业限制">
                      {recruitment.majorLimit.map((m) => (
                        <Tag key={m}>{m}</Tag>
                      ))}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="是否需材料">
                    {recruitment.needMaterial ? <Tag color="orange">需上传</Tag> : <Tag>不需要</Tag>}
                  </Descriptions.Item>
                </Descriptions>
              </>
            ) : (
              <Empty description="尚未发布招募" />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
