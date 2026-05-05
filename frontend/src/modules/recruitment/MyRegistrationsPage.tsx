import { Button, Card, Empty, Space, Table, Tag } from 'antd'
import { Link } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { RegistrationStatusTag } from '../../shared/components/StatusTag'
import { activities, registrations } from '../../shared/mock/data'

export default function MyRegistrationsPage() {
  // 演示用：把所有报名当作"我的"。真实接口将通过 userId 过滤。
  const data = registrations.map((r) => ({
    ...r,
    activity: activities.find((a) => a.id === r.activityId),
  }))

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="我的报名" subtitle="跟踪你提交的所有报名记录" />
      <Card>
        {data.length === 0 ? (
          <Empty description="暂无报名记录" />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            dataSource={data}
            pagination={false}
            columns={[
              { title: '活动', render: (_, row) => row.activity?.title ?? row.activityId },
              { title: '组织', render: (_, row) => row.activity?.organizationName ?? '-' },
              { title: '提交时间', dataIndex: 'submittedAt' },
              {
                title: '状态',
                dataIndex: 'status',
                render: (v) => <RegistrationStatusTag status={v} />,
              },
              {
                title: '拒绝理由',
                dataIndex: 'rejectReason',
                render: (v?: string) => (v ? <Tag color="red">{v}</Tag> : '-'),
              },
              {
                title: '操作',
                key: 'action',
                render: (_, row) => (
                  <Space>
                    <Link to={`/activities/${row.activityId}`}>
                      <Button size="small">查看活动</Button>
                    </Link>
                    {row.status === 'approved' && (
                      <Link to={`/activities/${row.activityId}/checkin`}>
                        <Button size="small" type="primary">
                          去签到
                        </Button>
                      </Link>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>
    </Space>
  )
}
