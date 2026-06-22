import { InboxOutlined, SendOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Form, Input, InputNumber, Row, Space, Spin, Typography, Upload, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { useActivity } from '../../shared/hooks/useActivities'
import { useCreateClosure, useSubmitClosure } from '../../shared/hooks/useClosures'

export default function ClosureApplyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: activity, isLoading: activityLoading } = useActivity(id)
  const createClosure = useCreateClosure()
  const submitClosure = useSubmitClosure()
  const [form] = Form.useForm()

  const isSubmitting = createClosure.isPending || submitClosure.isPending

  function onSubmit(values: { participants: number; cost?: number; summary: string }) {
    createClosure.mutate(
      { activityId: id!, summary: values.summary, participants: values.participants },
      {
        onSuccess: (closure) => {
          submitClosure.mutate(closure.id, {
            onSuccess: () => {
              message.success('结项申请已提交，将由审核人审批')
              navigate('/my/activities')
            },
            onError: () => {
              message.error('提交失败，请稍后重试')
            },
          })
        },
        onError: () => {
          message.error('创建结项申请失败')
        },
      }
    )
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="结项申请"
        subtitle={activity ? `${activity.title} · 提交结项材料` : ''}
        extra={
          <Button type="primary" icon={<SendOutlined />} loading={isSubmitting} onClick={() => form.submit()}>
            提交结项
          </Button>
        }
      />

      <Spin spinning={activityLoading}>
        <Row gutter={16}>
          <Col xs={24} lg={16}>
            <Card title="结项信息">
              <Form form={form} layout="vertical" onFinish={onSubmit}>
                <Form.Item name="participants" label="实际参与人数" rules={[{ required: true }]}>
                  <InputNumber min={0} addonAfter="人" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="cost" label="实际支出">
                  <InputNumber min={0} addonAfter="元" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="summary" label="活动总结" rules={[{ required: true, min: 50, message: '至少 50 字' }]}>
                  <Input.TextArea rows={6} placeholder="请概述活动开展情况、成效、不足与改进建议" />
                </Form.Item>
                <Form.Item name="attachments" label="结项材料">
                  <Upload.Dragger beforeUpload={() => false} multiple>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">上传现场照片、签到表、财务凭证等</p>
                  </Upload.Dragger>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="提交流程">
              <Typography.Paragraph>
                结项申请提交后将进入与立项相同的多级审核流转，审核人审核通过后活动将变为
                <Typography.Text code>closed</Typography.Text> 状态。
              </Typography.Paragraph>
              <Alert
                showIcon
                type="warning"
                message="一个活动通常仅有一条结项申请"
                description="如确需重新提交，请先联系审核人退回。"
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </Space>
  )
}
