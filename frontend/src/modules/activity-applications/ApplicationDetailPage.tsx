import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Divider, Empty, Space, Spin, Tag, Timeline, Typography, message } from 'antd'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { useApplication } from '../../shared/hooks/useActivityApplications'
import { submitActivityApplication } from '../../shared/api/activity-applications'
import { ApplicationStatusTag } from '../../shared/components/StatusTag'
import { useApprovalRecords } from '../../shared/hooks/useApprovals'
import type { ApprovalDecision } from '../../shared/api/dto'

const DECISION_LABEL: Record<ApprovalDecision, string> = {
  APPROVE: '通过',
  REJECT: '驳回',
  NEED_MORE: '要求补材料',
}

export default function ApplicationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: application, isLoading, refetch } = useApplication(id)
  const { data: records = [] } = useApprovalRecords(id)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!id) return
    setSubmitting(true)
    try {
      await submitActivityApplication(id)
      message.success('已提交，自动生成审核待办')
      refetch()
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return <Card><Spin style={{ display: 'block', textAlign: 'center', padding: 48 }} /></Card>
  }

  if (!application) {
    return <Card><Empty description="未找到该申请" /></Card>
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>{application.title}</Typography.Title>
          <Typography.Text type="secondary">{application.organizationName}</Typography.Text>
        </div>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/applications')}>返回列表</Button>
          {application.status === 'DRAFT' && (
            <Button type="primary" icon={<SendOutlined />} loading={submitting} onClick={handleSubmit}>
              提交申请
            </Button>
          )}
          <ApplicationStatusTag status={application.status} />
        </Space>
      </div>

      <Card title="申请信息">
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="活动名称" span={2}>{application.title}</Descriptions.Item>
          <Descriptions.Item label="发起组织">{application.organizationName}</Descriptions.Item>
          <Descriptions.Item label="负责人">{application.organizerName ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="预计开始">{application.expectedStart}</Descriptions.Item>
          <Descriptions.Item label="预计结束">{application.expectedEnd}</Descriptions.Item>
          <Descriptions.Item label="规模">{application.expectedScale} 人</Descriptions.Item>
          <Descriptions.Item label="预算">{application.budget} 元</Descriptions.Item>
          <Descriptions.Item label="地点" span={2}>{application.location ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="活动简介" span={2}>{application.brief}</Descriptions.Item>
        </Descriptions>

        {application.attachments.length > 0 && (
          <>
            <Divider orientation="left">附件材料</Divider>
            <Space direction="vertical">
              {application.attachments.map((f) => (
                <Tag key={f.id} color="blue">📎 {f.fileName} · {(f.fileSize / 1024).toFixed(1)} KB</Tag>
              ))}
            </Space>
          </>
        )}
      </Card>

      {records.length > 0 && (
        <Card title="审核历史">
          <Timeline
            items={records.map((h) => ({
              color: h.decision === 'APPROVE' ? 'green' : h.decision === 'REJECT' ? 'red' : 'orange',
              children: (
                <div>
                  <Typography.Text strong>第 {h.level} 级 · {h.reviewerName ?? '—'}</Typography.Text>
                  <br />
                  <Tag color={h.decision === 'APPROVE' ? 'green' : h.decision === 'REJECT' ? 'red' : 'orange'}>
                    {DECISION_LABEL[h.decision]}
                  </Tag>
                  {h.comment && <Typography.Text type="secondary"> {h.comment}</Typography.Text>}
                  <br />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{h.decidedAt}</Typography.Text>
                </div>
              ),
            }))}
          />
        </Card>
      )}
    </Space>
  )
}
