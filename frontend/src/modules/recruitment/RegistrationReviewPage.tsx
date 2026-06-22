import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Button, Card, Drawer, Input, Modal, Space, Spin, Statistic, Table, Tag, Typography, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { RegistrationStatusTag } from '../../shared/components/StatusTag'
import { useActivity } from '../../shared/hooks/useActivities'
import { useRecruitment, useRecruitmentSignups, useReviewSignup } from '../../shared/hooks/useRecruitments'
import type { SignupDto, SignupStatus } from '../../shared/api/dto'

export default function RegistrationReviewPage() {
  const { id } = useParams()
  const { data: recruitment } = useRecruitment(id)
  const { data: activity } = useActivity(recruitment?.activityId)
  const { data: signupsData, isLoading: signupsLoading, error: signupsError } = useRecruitmentSignups(id ?? '')
  const reviewMutation = useReviewSignup()

  const [filter, setFilter] = useState<'all' | SignupStatus>('SUBMITTED')
  const [active, setActive] = useState<SignupDto | null>(null)

  const list = signupsData?.items ?? []

  const data = useMemo(() => {
    return filter === 'all' ? list : list.filter((r) => r.status === filter)
  }, [list, filter])

  useEffect(() => {
    if (signupsError) {
      message.error('加载报名数据失败')
    }
  }, [signupsError])

  function review(reg: SignupDto, decision: 'approved' | 'rejected', reason?: string) {
    reviewMutation.mutate(
      { id: reg.id, body: { decision: decision === 'approved' ? 'APPROVE' : 'REJECT', comment: reason } },
      {
        onSuccess: () => {
          message.success(decision === 'approved' ? '已通过' : '已拒绝')
        },
        onError: () => {
          message.error('操作失败，请重试')
        },
      },
    )
  }

  function reject(reg: SignupDto) {
    let reason = ''
    Modal.confirm({
      title: '拒绝该报名？',
      content: (
        <Input.TextArea
          rows={3}
          placeholder="请填写拒绝理由（用户可见）"
          onChange={(e) => {
            reason = e.target.value
          }}
        />
      ),
      onOk: () => {
        if (!reason.trim()) {
          message.warning('请填写拒绝理由')
          return Promise.reject()
        }
        review(reg, 'rejected', reason)
        return Promise.resolve()
      },
    })
  }

  const counts = useMemo(() => {
    return {
      total: list.length,
      approved: list.filter((r) => r.status === 'APPROVED').length,
      submitted: list.filter((r) => r.status === 'SUBMITTED').length,
      rejected: list.filter((r) => r.status === 'REJECTED').length,
    }
  }, [list])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="报名审核" subtitle={activity ? `${activity.title} · 报名记录` : ''} />

      <Card>
        <Spin spinning={signupsLoading}>
          <Space size={32} wrap style={{ marginBottom: 16 }}>
            <Statistic title="总报名数" value={counts.total} />
            <Statistic title="待审核" value={counts.submitted} valueStyle={{ color: '#1677ff' }} />
            <Statistic title="已通过" value={counts.approved} valueStyle={{ color: '#52c41a' }} />
            <Statistic title="已拒绝" value={counts.rejected} valueStyle={{ color: '#ff4d4f' }} />
          </Space>

          <Space style={{ marginBottom: 12 }}>
            {(['all', 'SUBMITTED', 'APPROVED', 'REJECTED'] as const).map((k) => (
              <Tag.CheckableTag key={k} checked={filter === k} onChange={() => setFilter(k)}>
                {k === 'all' ? '全部' : k === 'SUBMITTED' ? '待审核' : k === 'APPROVED' ? '已通过' : '已拒绝'}
              </Tag.CheckableTag>
            ))}
          </Space>

          <Table
            rowKey="id"
            size="middle"
            dataSource={data}
            pagination={{ pageSize: 8 }}
            columns={[
              { title: '报名人', dataIndex: 'realName' },
              { title: '类型', dataIndex: 'userType', render: (v: string) => (v === 'STUDENT' ? '学生' : '教师') },
              { title: '学院', dataIndex: 'college' },
              { title: '专业', dataIndex: 'major' },
              { title: '年级', dataIndex: 'grade', width: 80 },
              { title: '提交时间', dataIndex: 'submittedAt' },
              { title: '状态', dataIndex: 'status', render: (v: SignupStatus) => <RegistrationStatusTag status={v} /> },
              {
                title: '操作',
                key: 'action',
                width: 220,
                render: (_, row) => (
                  <Space>
                    <Button size="small" onClick={() => setActive(row)}>
                      详情
                    </Button>
                    {row.status === 'SUBMITTED' && (
                      <>
                        <Button
                          size="small"
                          type="primary"
                          icon={<CheckOutlined />}
                          onClick={() => review(row, 'approved')}
                        >
                          通过
                        </Button>
                        <Button size="small" danger icon={<CloseOutlined />} onClick={() => reject(row)}>
                          拒绝
                        </Button>
                      </>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        </Spin>
      </Card>

      <Drawer width={420} title="报名详情" open={!!active} onClose={() => setActive(null)}>
        {active && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {active.realName}
            </Typography.Title>
            <Typography.Text type="secondary">
              {active.college} · {active.major} · {active.grade}
            </Typography.Text>
            <RegistrationStatusTag status={active.status} />
            {active.attachments?.[0] && (
              <Tag color="blue" style={{ padding: '4px 10px' }}>
                📎 {active.attachments[0].fileName} · {active.attachments[0].fileSize}
              </Tag>
            )}
            {active.decisionComment && (
              <Typography.Paragraph type="danger">拒绝理由：{active.decisionComment}</Typography.Paragraph>
            )}
          </Space>
        )}
      </Drawer>
    </Space>
  )
}
