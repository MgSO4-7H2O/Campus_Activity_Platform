import { SaveOutlined, SendOutlined } from '@ant-design/icons'
import {
  Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space, Spin, Switch, Typography, message,
} from 'antd'
import { useNavigate, useParams } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { useActivity } from '../../shared/hooks/useActivities'
import { useRecruitments, useCreateRecruitment, useUpdateRecruitment, usePublishRecruitment } from '../../shared/hooks/useRecruitments'
import type { UpsertRecruitmentBody } from '../../shared/api/dto'

export default function RecruitmentEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const { data: activity, isLoading: activityLoading } = useActivity(id)
  const { data: recruitmentsList, isLoading: listLoading } = useRecruitments()

  const createMutation = useCreateRecruitment()
  const updateMutation = useUpdateRecruitment()
  const publishMutation = usePublishRecruitment()

  const recruitment = recruitmentsList?.items?.find((r) => r.activityId === id)
  const isLoading = activityLoading || listLoading
  const isSaving = createMutation.isPending || updateMutation.isPending || publishMutation.isPending

  function handle(mode: 'save' | 'publish') {
    return form.validateFields().then(async (values) => {
      const body: UpsertRecruitmentBody = {
        activityId: id!,
        title: `招募 - ${activity?.title ?? ''}`,
        capacity: values.capacity,
        registrationStart: values.period[0].toISOString(),
        registrationEnd: values.period[1].toISOString(),
        allowedUserTypes: values.userTypes,
        allowedGrades: values.gradeLimit?.length > 0 ? values.gradeLimit : undefined,
        allowedMajors: values.majorLimit?.length > 0 ? values.majorLimit : undefined,
        requiresAttachment: values.needMaterial,
      }
      try {
        let recruitmentId: string
        if (recruitment) {
          await updateMutation.mutateAsync({ id: recruitment.id, body })
          recruitmentId = recruitment.id
        } else {
          const created = await createMutation.mutateAsync(body)
          recruitmentId = created.id
        }
        if (mode === 'publish') {
          await publishMutation.mutateAsync(recruitmentId)
        }
        message.success(mode === 'save' ? '草稿已保存' : '已发布招募，活动进入 recruiting 状态')
        navigate(`/activities/${id}`)
      } catch (err: any) {
        message.error(err?.message ?? '操作失败')
      }
    })
  }

  if (isLoading) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <PageHeader title="加载中..." />
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      </Space>
    )
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={recruitment ? '编辑招募' : '创建招募'}
        subtitle={activity ? `${activity.title} · 招募发布` : ''}
        extra={
          <>
            <Button icon={<SaveOutlined />} loading={isSaving} onClick={() => handle('save')}>
              保存草稿
            </Button>
            <Button type="primary" icon={<SendOutlined />} loading={isSaving} onClick={() => handle('publish')}>
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
                userTypes: recruitment?.allowedUserTypes ?? ['STUDENT'],
                needMaterial: recruitment?.requiresAttachment ?? false,
                gradeLimit: recruitment?.allowedGrades ?? [],
                majorLimit: recruitment?.allowedMajors ?? [],
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
