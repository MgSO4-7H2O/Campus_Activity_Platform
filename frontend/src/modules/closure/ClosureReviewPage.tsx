import { CheckOutlined, CloseOutlined, RollbackOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Empty, Input, Space, Tag, Typography, message } from 'antd'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { ApplicationStatusTag } from '../../shared/components/StatusTag'
import { closures } from '../../shared/mock/data'

export default function ClosureReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const closure = closures.find((c) => c.id === id) ?? closures[0]
  const [comment, setComment] = useState('')

  if (!closure) {
    return (
      <Card>
        <Empty description="未找到结项申请" />
      </Card>
    )
  }

  function decide(label: string) {
    if (!comment.trim()) {
      message.warning('请填写审核意见')
      return
    }
    message.success(`已${label}`)
    navigate('/approvals/closures')
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
                <Tag key={a.name} color="blue">
                  📎 {a.name} · {a.size}
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
        <Input.TextArea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="请填写审核意见" />
        <Space style={{ marginTop: 12 }}>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => decide('通过')}>
            通过
          </Button>
          <Button icon={<RollbackOutlined />} onClick={() => decide('要求补材料')}>
            要求补材料
          </Button>
          <Button danger icon={<CloseOutlined />} onClick={() => decide('驳回')}>
            驳回
          </Button>
        </Space>
      </Card>
    </Space>
  )
}
