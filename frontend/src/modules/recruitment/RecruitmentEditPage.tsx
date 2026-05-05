import { SaveOutlined, SendOutlined } from '@ant-design/icons'
import {
  Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space, Switch, Typography, message,
} from 'antd'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { activities, recruitments } from '../../shared/mock/data'

export default function RecruitmentEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const activity = activities.find((a) => a.id === id)
  const recruitment = id ? recruitments[id] : undefined
  const [submitting, setSubmitting] = useState<'save' | 'publish' | null>(null)

  function handle(mode: 'save' | 'publish') {
    return form.validateFields().then(() => {
      setSubmitting(mode)
      setTimeout(() => {
        setSubmitting(null)
        message.success(mode === 'save' ? '草稿已保存' : '已发布招募，活动进入 recruiting 状态')
        navigate(`/activities/${id}`)
      }, 350)
    })
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={recruitment ? '编辑招募' : '创建招募'}
        subtitle={activity ? `${activity.title} · 招募发布` : ''}
        extra={
          <>
            <Button icon={<SaveOutlined />} loading={submitting === 'save'} onClick={() => handle('save')}>
              保存草稿
            </Button>
            <Button type="primary" icon={<SendOutlined />} loading={submitting === 'publish'} onClick={() => handle('publish')}>
              发布招募
            </Button>
          </>
        }
      />

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="招募规则">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                capacity: recruitment?.capacity ?? activity?.capacity ?? 50,
                userTypes: recruitment?.userTypes ?? ['STUDENT'],
                needMaterial: recruitment?.needMaterial ?? false,
                gradeLimit: recruitment?.gradeLimit ?? [],
                majorLimit: recruitment?.majorLimit ?? [],
              }}
            >
              <Form.Item name="period" label="报名时间窗口" rules={[{ required: true }]}>
                <DatePicker.RangePicker showTime style={{ width: '100%' }} />
              </Form.Item>
              <Row gutter={12}>
                <Col xs={24} md={8}>
                  <Form.Item name="capacity" label="人数上限" rules={[{ required: true }]}>
                    <InputNumber min={1} addonAfter="人" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={16}>
                  <Form.Item name="userTypes" label="可报名用户类型" rules={[{ required: true }]}>
                    <Select
                      mode="multiple"
                      options={[
                        { value: 'STUDENT', label: '学生' },
                        { value: 'TEACHER', label: '教师' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="gradeLimit" label="学生年级限制（仅学生有效）">
                <Select mode="tags" placeholder="如 2023 / 2024，回车添加" />
              </Form.Item>
              <Form.Item name="majorLimit" label="专业限制（仅学生有效）">
                <Select mode="tags" placeholder="如 软件工程 / 人工智能" />
              </Form.Item>
              <Form.Item name="needMaterial" label="是否需上传报名材料" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="materialDesc" label="材料说明（可选）">
                <Input.TextArea rows={3} placeholder="如：请提交不超过 5MB 的作品集 PDF" />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="发布提示">
            <Typography.Paragraph>
              <Typography.Text strong>发布即生效</Typography.Text>
              ：发布后活动状态自动从 <Typography.Text code>planned</Typography.Text> 变为
              <Typography.Text code>recruiting</Typography.Text>，并向通讯录广播一条公开公告。
            </Typography.Paragraph>
            <Typography.Paragraph>
              <Typography.Text strong>限制条件</Typography.Text>
              ：年级 / 专业限制将在用户提交报名时进行二次校验，前端只负责展示。
            </Typography.Paragraph>
            <Alert
              showIcon
              type="info"
              message="多次发布"
              description="发布后仍可再次编辑并重新发布；活动一旦进入 ongoing，将无法再修改招募规则。"
            />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
