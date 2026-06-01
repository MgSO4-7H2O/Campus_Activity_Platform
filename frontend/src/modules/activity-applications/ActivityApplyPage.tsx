import { InboxOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import {
  Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space, Steps, Typography, Upload, message,
} from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import type { Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  createActivityApplication,
  submitActivityApplication,
  uploadApplicationAttachment,
} from '../../shared/api/activity-applications'
import type { OrganizationDto, UpsertActivityApplicationBody } from '../../shared/api/dto'
import { getApiErrorMessage } from '../../shared/api/error'
import { listOrganizations } from '../../shared/api/organizations'
import PageHeader from '../../shared/components/PageHeader'

type Mode = 'draft' | 'submit'
type DateValue = Dayjs | Date | string
type ActivityApplyFormValue = {
  title: string
  organizationId: string
  category: string
  period: [DateValue, DateValue]
  location?: string
  expectedScale: number
  budget: number
  brief: string
  plan: string
  attachments?: UploadFile[]
}
type ValidationError = {
  errorFields: unknown[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidationError(value: unknown): value is ValidationError {
  return isRecord(value) && Array.isArray(value.errorFields)
}

function toIsoString(value: DateValue): string {
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  return value.toDate().toISOString()
}

function toApplicationBody(values: ActivityApplyFormValue): UpsertActivityApplicationBody {
  const [expectedStart, expectedEnd] = values.period
  return {
    title: values.title,
    organizationId: values.organizationId,
    brief: values.brief,
    expectedStart: toIsoString(expectedStart),
    expectedEnd: toIsoString(expectedEnd),
    expectedScale: Number(values.expectedScale),
    budget: Number(values.budget),
    location: values.location,
  }
}

function getUploadFileList(event: unknown): UploadFile[] {
  if (Array.isArray(event)) return event
  if (!isRecord(event) || !Array.isArray(event.fileList)) return []
  return event.fileList as UploadFile[]
}

async function uploadAttachments(applicationId: string, files: UploadFile[] | undefined): Promise<void> {
  const uploadFiles = files ?? []
  for (const file of uploadFiles) {
    if (!file.originFileObj) {
      throw new Error(`Attachment ${file.name} has no file object`)
    }
    await uploadApplicationAttachment(applicationId, file.originFileObj)
  }
}

export default function ActivityApplyPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm<ActivityApplyFormValue>()
  const [organizations, setOrganizations] = useState<OrganizationDto[]>([])
  const [loadingOrganizations, setLoadingOrganizations] = useState(false)
  const [submitting, setSubmitting] = useState<Mode | null>(null)

  useEffect(() => {
    setLoadingOrganizations(true)
    listOrganizations({ status: 'ACTIVE' })
      .then(setOrganizations)
      .catch((error: unknown) => message.error(getApiErrorMessage(error, '加载组织失败')))
      .finally(() => setLoadingOrganizations(false))
  }, [])

  const upload: UploadProps = {
    name: 'file',
    multiple: true,
    beforeUpload: () => false,
    onChange: (info) => {
      if (info.fileList.length > 0) {
        message.success(`已选择 ${info.fileList.length} 个文件`)
      }
    },
  }

  async function onFinish(mode: Mode): Promise<void> {
    let values: ActivityApplyFormValue
    try {
      values = await form.validateFields()
    } catch (error: unknown) {
      if (isValidationError(error)) return
      throw error
    }

    setSubmitting(mode)
    try {
      const application = await createActivityApplication(toApplicationBody(values))
      await uploadAttachments(application.id, values.attachments)
      if (mode === 'submit') {
        await submitActivityApplication(application.id)
      }
      message.success(mode === 'draft' ? '草稿已保存' : '已提交，自动生成审核待办')
      navigate('/applications')
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, mode === 'draft' ? '保存失败' : '提交失败'))
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="活动立项申请"
        subtitle="请按要求填写活动方案、上传材料后提交，提交后将自动生成审核待办"
        extra={
          <>
            <Button icon={<SaveOutlined />} loading={submitting === 'draft'} onClick={() => { void onFinish('draft') }}>
              保存草稿
            </Button>
            <Button type="primary" icon={<SendOutlined />} loading={submitting === 'submit'} onClick={() => { void onFinish('submit') }}>
              提交申请
            </Button>
          </>
        }
      />

      <Steps
        size="small"
        current={0}
        items={[
          { title: '填写方案', description: '本页' },
          { title: '审核流转', description: '一级审核 → 二级审核' },
          { title: '正式活动', description: '通过后自动生成' },
        ]}
      />

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="活动信息">
            <Form form={form} layout="vertical" requiredMark="optional">
              <Form.Item name="title" label="活动名称" rules={[{ required: true, message: '请输入活动名称' }]}>
                <Input placeholder="例如：2026 春季编程马拉松" maxLength={60} showCount />
              </Form.Item>

              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item name="organizationId" label="发起组织" rules={[{ required: true, message: '请选择发起组织' }]}>
                    <Select
                      placeholder="选择你所在的组织"
                      loading={loadingOrganizations}
                      options={organizations.map((organization) => ({
                        value: organization.id,
                        label: organization.name,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="category" label="活动类别" rules={[{ required: true }]}>
                    <Select
                      placeholder="选择类别"
                      options={[
                        { value: 'academic', label: '学术科创' },
                        { value: 'culture', label: '文体艺术' },
                        { value: 'volunteer', label: '志愿服务' },
                        { value: 'practice', label: '社会实践' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="period" label="活动时间" rules={[{ required: true, message: '请选择起止时间' }]}>
                <DatePicker.RangePicker showTime style={{ width: '100%' }} />
              </Form.Item>

              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item name="location" label="活动地点" rules={[{ required: true }]}>
                    <Input placeholder="如 紫金港校区 · 图书馆 B201" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="expectedScale" label="预计规模" rules={[{ required: true }]}>
                    <InputNumber suffix="人" min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="budget" label="预算" rules={[{ required: true }]}>
                    <InputNumber suffix="元" min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="brief" label="活动简介" rules={[{ required: true, min: 30, message: '至少 30 字' }]}>
                <Input.TextArea rows={4} placeholder="简要说明活动主旨、目标受众、主要环节" maxLength={500} showCount />
              </Form.Item>

              <Form.Item name="plan" label="活动方案" rules={[{ required: true, min: 50, message: '至少 50 字' }]}>
                <Input.TextArea rows={6} placeholder="详细方案：流程安排、嘉宾邀请、人员分工、应急预案" />
              </Form.Item>

              <Form.Item name="attachments" label="申请材料" valuePropName="fileList" getValueFromEvent={getUploadFileList}>
                <Upload.Dragger {...upload}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                  <p className="ant-upload-hint">支持活动方案、安全预案、海报等材料，单个不超过 10MB</p>
                </Upload.Dragger>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="提交后会发生什么？">
            <Typography.Paragraph>
              <Typography.Text strong>1. 自动生成审核待办</Typography.Text>
              <br />
              系统按发起组织所属层级匹配审核人，自动创建一级审核任务。
            </Typography.Paragraph>
            <Typography.Paragraph>
              <Typography.Text strong>2. 多级审核流转</Typography.Text>
              <br />
              一级通过后自动进入下一级；任意一级驳回或要求补材料则回到你这里。
            </Typography.Paragraph>
            <Typography.Paragraph>
              <Typography.Text strong>3. 通过后自动生成正式活动</Typography.Text>
              <br />
              你即可创建招募、签到等下游对象。
            </Typography.Paragraph>

            <Alert
              type="warning"
              showIcon
              message="提交后将不能直接修改"
              description="如需修改，请等待审核人退回（need_more 状态）。"
            />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
