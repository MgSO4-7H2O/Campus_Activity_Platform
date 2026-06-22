import { CheckOutlined, CloseOutlined, RollbackOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Empty, Input, Space, Spin, Tag, Typography, message } from 'antd'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { ApplicationStatusTag } from '../../shared/components/StatusTag'
import { useClosureApplication, useReviewClosure } from '../../shared/hooks/useClosures'

export default function ClosureReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [comment, setComment] = useState('')

  const { data: closure, isLoading, isError, error } = useClosureApplication(id)
  const reviewMutation = useReviewClosure()

  if (isLoading) {
    return (
      <Card>
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      </Card>
    )
  }

  if (isError) {
    message.error(error instanceof Error ? error.message : '加载结项申请失败')
    return (
      <Card>
        <Empty description="加载结项申请失败" />
      </Card>
    )
  }

  if (!closure) {
    return (
      <Card>
        <Empty description="未找到结项申请" />
      </Card>
    )
  }

  function decide(label: string, decision: 'APPROVE' | 'REJECT' | 'NEED_MORE') {
    if (!comment.trim()) {
      message.warning('请填写审核意见')
      return
    }
    reviewMutation.mutate(
      { id: id!, body: { decision, comment: comment.trim() } },
      {
        onSuccess: () => {
          message.success(`已${label}`)
          navigate('/approvals/closures')
        },
        onError: (err) => {
          message.error(err instanceof Error ? err.message : '审核操作失败')
        },
      },
    )
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="结项审核"
        subtitle={`${closure.activityTitle} · 申请人 ${closure.applicantName}`}
        extra={<ApplicationStatusTag status={closure.status} />}
      />

      <Card title="结项内容">
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="活动名称" span={2}>
            {closure.activityTitle}
          </Descriptions.Item>
          <Descriptions.Item label="申请人">{closure.applicantName}</Descriptions.Item>
          <Descriptions.Item label="提交时间">{closure.submittedAt}</Descriptions.Item>
          <Descriptions.Item label="实际参与人数">{closure.participants}</Descriptions.Item>
          <Descriptions.Item label="附件">
            <Space wrap>
              {closure.attachments.map((a) => (
                <Tag key={a.id} color="blue">
                  📎 {a.fileName} · {a.fileSize}
                </Tag>
              ))}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="活动总结" span={2}>
            <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
              {closure.summary}
            </Typography.Paragraph>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="审核意见">
        <Input.TextArea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="请填写审核意见"
        />
        <Space style={{ marginTop: 12 }}>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={reviewMutation.isPending}
            onClick={() => decide('通过', 'APPROVE')}
          >
            通过
          </Button>
          <Button
            icon={<RollbackOutlined />}
            loading={reviewMutation.isPending}
            onClick={() => decide('要求补材料', 'NEED_MORE')}
          >
            要求补材料
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            loading={reviewMutation.isPending}
            onClick={() => decide('驳回', 'REJECT')}
          >
            驳回
          </Button>
        </Space>
      </Card>
    </Space>
  )
}
