import { Button, Card, Empty, message, Space, Spin, Table, Tag } from 'antd'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'

import PageHeader from '../../shared/components/PageHeader'
import { RegistrationStatusTag } from '../../shared/components/StatusTag'
import { useMySignups, useActivities } from '../../shared/hooks'

export default function MyRegistrationsPage() {
  const { data: signupsData, isLoading: signupsLoading, error: signupsError } = useMySignups()
  const { data: activitiesData } = useActivities()

  const signups = signupsData?.items ?? []
  const activities = activitiesData?.items ?? []

  const data = signups.map((s) => ({
    ...s,
    activity: activities.find((a) => a.id === s.activityId),
  }))

  useEffect(() => {
    if (signupsError) {
      message.error('加载报名记录失败')
    }
  }, [signupsError])

  if (signupsLoading) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <PageHeader title="我的报名" subtitle="跟踪你提交的所有报名记录" />
        <Card>
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin />
          </div>
        </Card>
      </Space>
    )
  }

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
                dataIndex: 'decisionComment',
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
                    {row.status === 'APPROVED' && (
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
