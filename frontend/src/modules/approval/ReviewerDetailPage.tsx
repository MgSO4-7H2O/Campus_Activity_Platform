import { CheckOutlined, CloseOutlined, RollbackOutlined } from '@ant-design/icons'
import {
  Button, Card, Col, Descriptions, Divider, Empty, Input, Modal, Row, Space, Spin, Steps, Tag, Timeline, Typography, message,
} from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { getReviewerApplication, listApprovalRecords, reviewActivityApplication } from '../../shared/api/activity-applications'
import { getApiErrorMessage } from '../../shared/api/error'
import type {
  ActivityApplicationDto,
  ActivityApplicationStatus,
  ApprovalDecision,
  ApprovalRecordDto,
} from '../../shared/api/dto'

const APP_STATUS_META: Record<ActivityApplicationStatus, { text: string; color: string }> = {
  DRAFT: { text: '草稿', color: 'default' },
  SUBMITTED: { text: '已提交', color: 'blue' },
  APPROVING: { text: '审核中', color: 'processing' },
  NEED_MORE: { text: '待补材料', color: 'orange' },
  REJECTED: { text: '已驳回', color: 'red' },
  APPROVED: { text: '已通过', color: 'green' },
  ARCHIVED: { text: '已归档', color: 'gray' },
}

function AppStatusTag({ status }: { status: ActivityApplicationStatus }) {
  const meta = APP_STATUS_META[status]
  return <Tag color={meta.color}>{meta.text}</Tag>
}

const DECISION_LABEL: Record<ApprovalDecision, string> = {
  APPROVE: '通过',
  REJECT: '驳回',
  NEED_MORE: '要求补材料',
}

const DECISION_COLOR: Record<ApprovalDecision, string> = {
  APPROVE: 'green',
  REJECT: 'red',
  NEED_MORE: 'orange',
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export default function ReviewerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState<ActivityApplicationDto | null>(null)
  const [records, setRecords] = useState<ApprovalRecordDto[]>([])
  const [comment, setComment] = useState('')
  const [decisionToConfirm, setDecisionToConfirm] = useState<ApprovalDecision | null>(null)
  const [submitting, setSubmitting] = useState<ApprovalDecision | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const app = await getReviewerApplication(id)
      setApplication(app)
      try {
        setRecords(await listApprovalRecords(id))
      } catch {
        setRecords([])
      }
    } catch {
      setApplication(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  function confirmDecision(decision: ApprovalDecision) {
    if (!comment.trim()) {
      message.warning('请填写审核意见')
      return
    }
    setDecisionToConfirm(decision)
  }

  async function submitDecision() {
    if (!decisionToConfirm || !id) return
    const decision = decisionToConfirm
    setSubmitting(decision)
    try {
      await reviewActivityApplication(id, { decision, comment })
      message.success(`已${DECISION_LABEL[decision]}`)
      setDecisionToConfirm(null)
      navigate('/approvals')
    } catch (err) {
      message.error(getApiErrorMessage(err, '提交审核失败'))
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <Spin />
      </Card>
    )
  }

  if (!application) {
    return (
      <Card>
        <Empty description="未找到该申请" />
      </Card>
    )
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="审核详情"
        subtitle={`${application.organizationName} · ${application.title}`}
        extra={
          <>
            <Button onClick={() => navigate('/approvals')}>返回待办</Button>
            <AppStatusTag status={application.status} />
          </>
        }
      />

      <Steps
        current={records.length}
        items={[
          { title: '一级审核', description: records[0]?.reviewerName ?? '—' },
          { title: '二级审核', description: records[1]?.reviewerName ?? '—' },
          { title: '通过 / 归档' },
        ]}
      />

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="申请信息">
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="活动名称" span={2}>
                {application.title}
              </Descriptions.Item>
              <Descriptions.Item label="发起组织">{application.organizationName}</Descriptions.Item>
              <Descriptions.Item label="负责人">{application.organizerName ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="预计开始">{application.expectedStart}</Descriptions.Item>
              <Descriptions.Item label="预计结束">{application.expectedEnd}</Descriptions.Item>
              <Descriptions.Item label="规模">{application.expectedScale} 人</Descriptions.Item>
              <Descriptions.Item label="预算">{application.budget} 元</Descriptions.Item>
              <Descriptions.Item label="活动简介" span={2}>
                {application.brief}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">附件材料</Divider>
            {application.attachments.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {application.attachments.map((f) => (
                  <Tag key={f.id} color="blue" style={{ padding: '4px 10px' }}>
                    📎 {f.fileName} · {formatSize(f.fileSize)}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无附件" />
            )}
          </Card>

          <Card title="审核意见" style={{ marginTop: 16 }}>
            <Input.TextArea
              rows={4}
              placeholder="请填写审核意见（驳回 / 要求补材料时为必填）"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Space style={{ marginTop: 12 }}>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={submitting === 'APPROVE'}
                onClick={() => confirmDecision('APPROVE')}
              >
                通过
              </Button>
              <Button
                icon={<RollbackOutlined />}
                loading={submitting === 'NEED_MORE'}
                onClick={() => confirmDecision('NEED_MORE')}
              >
                要求补材料
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                loading={submitting === 'REJECT'}
                onClick={() => confirmDecision('REJECT')}
              >
                驳回
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="审核历史">
            {records.length > 0 ? (
              <Timeline
                items={records.map((h) => ({
                  color: DECISION_COLOR[h.decision],
                  children: (
                    <div>
                      <Typography.Text strong>
                        第 {h.level} 级 · {h.reviewerName ?? '—'}
                      </Typography.Text>
                      <Typography.Paragraph style={{ margin: '4px 0' }}>
                        <Tag>{DECISION_LABEL[h.decision]}</Tag>
                        {h.comment}
                      </Typography.Paragraph>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(h.decidedAt).toLocaleString('zh-CN')}
                      </Typography.Text>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="尚无审核记录" />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={decisionToConfirm ? `确认${DECISION_LABEL[decisionToConfirm]}该申请？` : ''}
        open={!!decisionToConfirm}
        confirmLoading={!!submitting}
        onOk={submitDecision}
        onCancel={() => setDecisionToConfirm(null)}
      >
        <Typography.Paragraph>
          <Typography.Text type="secondary">审核意见：</Typography.Text>
          {comment}
        </Typography.Paragraph>
      </Modal>
    </Space>
  )
}
