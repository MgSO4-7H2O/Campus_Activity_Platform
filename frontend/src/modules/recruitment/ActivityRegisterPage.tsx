import { InboxOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Form, Input, Row, Space, Tag, Typography, Upload, message } from 'antd'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { activities, recruitments } from '../../shared/mock/data'
import { useAuthStore } from '../../shared/auth/store'

export default function ActivityRegisterPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.user)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const activity = activities.find((a) => a.id === id)
  const recruitment = id ? recruitments[id] : undefined

  if (!activity) {
    return <Card>未找到活动</Card>
  }
  if (!recruitment || recruitment.status !== 'published') {
    return (
      <Card>
        <Alert showIcon type="warning" message="该活动当前未开放报名" />
      </Card>
    )
  }

  function onSubmit(values: { note?: string }) {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      message.success('报名已提交，等待负责人审核')
      navigate('/my/registrations')
    }, 350)
    return values
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="报名"
        subtitle={`${activity.title} · 招募中`}
        extra={
          <Button onClick={() => navigate(`/activities/${id}`)}>返回活动详情</Button>
        }
      />

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="确认报名信息">
            <Alert
              showIcon
              type="info"
              style={{ marginBottom: 16 }}
              message="系统会按招募规则自动校验"
              description={
                <Space wrap>
                  <Tag>用户类型：{recruitment.userTypes.join(' / ')}</Tag>
                  {recruitment.gradeLimit && <Tag>年级：{recruitment.gradeLimit.join(' / ')}</Tag>}
                  {recruitment.majorLimit && <Tag>专业：{recruitment.majorLimit.join(' / ')}</Tag>}
                  <Tag>窗口：{recruitment.registrationStart} ~ {recruitment.registrationEnd}</Tag>
                </Space>
              }
            />

            <Form form={form} layout="vertical" onFinish={onSubmit}>
              <Form.Item label="姓名">
                <Input value={me?.realName ?? ''} disabled />
              </Form.Item>
              <Form.Item label="用户类型">
                <Input value={me?.userType === 'TEACHER' ? '教师' : '学生'} disabled />
              </Form.Item>
              <Form.Item label="联系电话">
                <Input value={me?.phone ?? ''} disabled placeholder="请到 /me/edit 完善" />
              </Form.Item>
              {recruitment.needMaterial && (
                <Form.Item label="报名材料" required>
                  <Upload.Dragger beforeUpload={() => false} maxCount={1}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                  </Upload.Dragger>
                </Form.Item>
              )}
              <Form.Item name="note" label="备注（可选）">
                <Input.TextArea rows={3} placeholder="补充说明，便于负责人判断" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} size="large">
                提交报名
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="活动概览">
            <Typography.Paragraph>
              <Typography.Text strong>{activity.title}</Typography.Text>
            </Typography.Paragraph>
            <Typography.Paragraph type="secondary">{activity.brief}</Typography.Paragraph>
            <Typography.Text type="secondary" style={{ display: 'block' }}>
              📅 {activity.startAt}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: 'block' }}>
              📍 {activity.location}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: 'block' }}>
              👥 {activity.registered}/{activity.capacity} 人
            </Typography.Text>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
