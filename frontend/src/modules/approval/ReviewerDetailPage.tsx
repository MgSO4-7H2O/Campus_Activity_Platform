import { CheckOutlined, CloseOutlined, RollbackOutlined } from '@ant-design/icons'
import {
  Button, Card, Col, Descriptions, Divider, Empty, Input, Modal, Row, Space, Steps, Tag, Timeline, Typography, message,
} from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { ApplicationStatusTag } from '../../shared/components/StatusTag'
import { myApplications, orgs, reviewerInbox } from '../../shared/mock/data'

type Decision = 'approve' | 'reject' | 'need_more'

const DECISION_LABEL: Record<Decision, string> = {
  approve: '通过',
  reject: '驳回',
  need_more: '要求补材料',
}

export default function ReviewerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [comment, setComment] = useState('')
  const [pending, setPending] = useState<Decision | null>(null)

  const application = useMemo(() => myApplications.find((a) => a.id === id), [id])
  const todo = useMemo(() => reviewerInbox.find((t) => t.applicationId === id), [id])

  if (!application && !todo) {
    return (
      <Card>
        <Empty description="未找到该申请" />
      </Card>
    )
  }

  const title = application?.title ?? todo!.title
  const orgName = application
    ? orgs.find((o) => o.id === application.organizationId)?.name
    : todo?.organizationName

  function confirmDecision(decision: Decision) {
    if (!comment.trim()) {
      message.warning('请填写审核意见')
      return
    }
    Modal.confirm({
      title: `确认${DECISION_LABEL[decision]}该申请？`,
      content: (
        <div>
          <Typography.Paragraph>
            <Typography.Text type="secondary">审核意见：</Typography.Text>
            {comment}
          </Typography.Paragraph>
        </div>
      ),
      onOk: () =>
        new Promise<void>((resolve) => {
          setPending(decision)
          setTimeout(() => {
            setPending(null)
            message.success(`已${DECISION_LABEL[decision]}`)
            navigate('/approvals')
            resolve()
          }, 400)
        }),
    })
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="审核详情"
        subtitle={`${orgName ?? ''} · ${title}`}
        extra={
          <>
            <Button onClick={() => navigate('/approvals')}>返回待办</Button>
            {application && <ApplicationStatusTag status={application.status} />}
          </>
        }
      />

      <Steps
        current={(application?.reviewHistory.length ?? 0)}
        items={[
          { title: '一级审核', description: application?.reviewHistory[0]?.reviewer ?? '—' },
          { title: '二级审核', description: application?.reviewHistory[1]?.reviewer ?? '—' },
          { title: '通过 / 归档' },
        ]}
      />

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="申请信息">
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="活动名称" span={2}>
                {title}
              </Descriptions.Item>
              <Descriptions.Item label="发起组织">{orgName}</Descriptions.Item>
              <Descriptions.Item label="负责人">{application?.organizerName ?? todo?.organizerName}</Descriptions.Item>
              <Descriptions.Item label="预计开始">{application?.expectedStart ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="预计结束">{application?.expectedEnd ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="规模">{application?.expectedScale ?? '—'} 人</Descriptions.Item>
              <Descriptions.Item label="预算">{application?.budget ?? '—'} 元</Descriptions.Item>
              <Descriptions.Item label="活动简介" span={2}>
                {application?.brief ?? todo?.brief}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">附件材料</Divider>
            {(application?.attachments?.length ?? 0) > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {application!.attachments.map((f) => (
                  <Tag key={f.name} color="blue" style={{ padding: '4px 10px' }}>
                    📎 {f.name} · {f.size}
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
                loading={pending === 'approve'}
                onClick={() => confirmDecision('approve')}
              >
                通过
              </Button>
              <Button
                icon={<RollbackOutlined />}
                loading={pending === 'need_more'}
                onClick={() => confirmDecision('need_more')}
              >
                要求补材料
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                loading={pending === 'reject'}
                onClick={() => confirmDecision('reject')}
              >
                驳回
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="审核历史">
            {application && application.reviewHistory.length > 0 ? (
              <Timeline
                items={application.reviewHistory.map((h) => ({
                  color: h.decision === 'approve' ? 'green' : h.decision === 'reject' ? 'red' : 'orange',
                  children: (
                    <div>
                      <Typography.Text strong>第 {h.level} 级 · {h.reviewer}</Typography.Text>
                      <Typography.Paragraph style={{ margin: '4px 0' }}>
                        <Tag>{h.decision === 'approve' ? '通过' : h.decision === 'reject' ? '驳回' : '要求补材料'}</Tag>
                        {h.comment}
                      </Typography.Paragraph>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {h.at}
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
    </Space>
  )
}
