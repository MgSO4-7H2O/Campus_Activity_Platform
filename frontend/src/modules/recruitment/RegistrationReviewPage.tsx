import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Button, Card, Drawer, Input, Modal, Space, Statistic, Table, Tag, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { RegistrationStatusTag } from '../../shared/components/StatusTag'
import { activities, registrations as seed, type Registration, type RegistrationStatus } from '../../shared/mock/data'

export default function RegistrationReviewPage() {
  const { id } = useParams()
  const activity = activities.find((a) => a.id === id)
  const [list, setList] = useState<Registration[]>(seed)
  const [filter, setFilter] = useState<'all' | RegistrationStatus>('submitted')
  const [active, setActive] = useState<Registration | null>(null)

  const data = useMemo(() => {
    return list
      .filter((r) => r.activityId === id)
      .filter((r) => (filter === 'all' ? true : r.status === filter))
  }, [list, filter, id])

  function review(reg: Registration, decision: 'approved' | 'rejected', reason?: string) {
    setList((cur) => cur.map((r) => (r.id === reg.id ? { ...r, status: decision, rejectReason: reason } : r)))
    message.success(decision === 'approved' ? '已通过' : '已拒绝')
  }

  function reject(reg: Registration) {
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
    const all = list.filter((r) => r.activityId === id)
    return {
      total: all.length,
      approved: all.filter((r) => r.status === 'approved').length,
      submitted: all.filter((r) => r.status === 'submitted').length,
      rejected: all.filter((r) => r.status === 'rejected').length,
    }
  }, [list, id])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="报名审核" subtitle={activity ? `${activity.title} · 报名记录` : ''} />

      <Card>
        <Space size={32} wrap style={{ marginBottom: 16 }}>
          <Statistic title="总报名数" value={counts.total} />
          <Statistic title="待审核" value={counts.submitted} valueStyle={{ color: '#1677ff' }} />
          <Statistic title="已通过" value={counts.approved} valueStyle={{ color: '#52c41a' }} />
          <Statistic title="已拒绝" value={counts.rejected} valueStyle={{ color: '#ff4d4f' }} />
        </Space>

        <Space style={{ marginBottom: 12 }}>
          {(['all', 'submitted', 'approved', 'rejected'] as const).map((k) => (
            <Tag.CheckableTag key={k} checked={filter === k} onChange={() => setFilter(k)}>
              {k === 'all' ? '全部' : k === 'submitted' ? '待审核' : k === 'approved' ? '已通过' : '已拒绝'}
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
            { title: '状态', dataIndex: 'status', render: (v: RegistrationStatus) => <RegistrationStatusTag status={v} /> },
            {
              title: '操作',
              key: 'action',
              width: 220,
              render: (_, row) => (
                <Space>
                  <Button size="small" onClick={() => setActive(row)}>
                    详情
                  </Button>
                  {row.status === 'submitted' && (
                    <>
                      <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => review(row, 'approved')}>
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
            {active.material && (
              <Tag color="blue" style={{ padding: '4px 10px' }}>
                📎 {active.material.name} · {active.material.size}
              </Tag>
            )}
            {active.rejectReason && (
              <Typography.Paragraph type="danger">拒绝理由：{active.rejectReason}</Typography.Paragraph>
            )}
          </Space>
        )}
      </Drawer>
    </Space>
  )
}
