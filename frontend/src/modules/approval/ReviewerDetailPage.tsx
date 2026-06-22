import { CheckOutlined, CloseOutlined, RollbackOutlined } from '@ant-design/icons'
import {
  Button, Card, Col, Descriptions, Divider, Empty, Input, Modal, Row, Space, Spin, Steps, Tag, Timeline, Typography, message,
} from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ApplicationStatusTag } from '../../shared/components/StatusTag'
import { useApprovalRecords, useReviewApplication, useReviewerApplication } from '../../shared/hooks/useApprovals'
import type { ApplicationAttachmentDto, ApprovalDecision, ApprovalRecordDto } from '../../shared/api/dto'

const DECISION_LABEL: Record<ApprovalDecision, string> = {
  APPROVE: '通过',
  REJECT: '驳回',
  NEED_MORE: '要求补材料',
}

export default function ReviewerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [comment, setComment] = useState('')
  const [decisionToConfirm, setDecisionToConfirm] = useState<ApprovalDecision | null>(null)

  const { data: application, isLoading, refetch } = useReviewerApplication(id)
  const { data: records = [] } = useApprovalRecords(id)
  const reviewMutation = useReviewApplication()

  function confirmDecision(decision: ApprovalDecision) {
    if (!comment.trim()) {
      message.warning('请填写审核意见')
      return
    }
    setDecisionToConfirm(decision)
  }

  async function submitDecision() {
    if (!decisionToConfirm || !id) return

    await reviewMutation.mutateAsync(
      { id, body: { decision: decisionToConfirm, comment } },
      {
        onSuccess: () => {
          setDecisionToConfirm(null)
          setComment('')
          message.success(`已${DECISION_LABEL[decisionToConfirm]}`)
          refetch()
        },
        onError: (error) => {
          message.error(`审核失败：${error instanceof Error ? error.message : '未知错误'}`)
          setDecisionToConfirm(null)
        },
      },
    )
  }

  const reviewSteps = useMemo(() => {
    const maxLevel = application?.currentApprovalLevel ?? 1
    const items = []
    for (let i = 0; i < maxLevel; i++) {
      const record = records.find((r: ApprovalRecordDto) => r.level === i + 1)
      items.push({
        title: `第 ${i + 1} 级审核`,
        description: record?.reviewerName ?? '—',
        status: record
          ? record.decision === 'APPROVE'
            ? ('finish' as const)
            : ('error' as const)
          : ('process' as const),
      })
    }
    items.push({ title: '通过 / 归档', description: '', status: 'wait' as const })
    return items
  }, [application, records])

  if (isLoading) {
    return (
      <Card>
        <Spin style={{ display: 'block', textAlign: 'center', padding: 48 }} />
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>审核详情</Typography.Title>
          <Typography.Text type="secondary">
            {application.organizationName} · {application.title}
          </Typography.Text>
        </div>
        <Space>
          <Button onClick={() => navigate('/approvals')}>返回待办</Button>
          <ApplicationStatusTag status={application.status} />
        </Space>
      </div>

      <Steps current={records.length} items={reviewSteps} />

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
              <Descriptions.Item label="地点" span={2}>
                {application.location ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="活动简介" span={2}>
                {application.brief}
              </Descriptions.Item>
            </Descriptions>

            {application.attachments.length > 0 && (
              <>
                <Divider orientation="left">附件材料</Divider>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {application.attachments.map((f: ApplicationAttachmentDto) => (
                    <Tag key={f.id} color="blue" style={{ padding: '4px 10px' }}>
                      📎 {f.fileName} · {(f.fileSize / 1024).toFixed(1)} KB
                    </Tag>
                  ))}
                </Space>
              </>
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
                loading={reviewMutation.isPending && decisionToConfirm === 'APPROVE'}
                onClick={() => confirmDecision('APPROVE')}
              >
                通过
              </Button>
              <Button
                icon={<RollbackOutlined />}
                loading={reviewMutation.isPending && decisionToConfirm === 'NEED_MORE'}
                onClick={() => confirmDecision('NEED_MORE')}
              >
                要求补材料
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                loading={reviewMutation.isPending && decisionToConfirm === 'REJECT'}
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
                items={records.map((h: ApprovalRecordDto) => ({
                  color: h.decision === 'APPROVE' ? 'green' : h.decision === 'REJECT' ? 'red' : 'orange',
                  children: (
                    <div>
                      <Typography.Text strong>
                        第 {h.level} 级 · {h.reviewerName ?? '—'}
                      </Typography.Text>
                      <Typography.Paragraph style={{ margin: '4px 0' }}>
                        <Tag color={h.decision === 'APPROVE' ? 'green' : h.decision === 'REJECT' ? 'red' : 'orange'}>
                          {DECISION_LABEL[h.decision]}
                        </Tag>
                        {h.comment}
                      </Typography.Paragraph>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {h.decidedAt}
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
        confirmLoading={reviewMutation.isPending}
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
