import { Button, Card, Empty, Space, Spin, Table, Typography } from 'antd'
import { Link } from 'react-router-dom'

import { ActivityStatusTag } from '../../shared/components/StatusTag'
import { useMyActivities } from '../../shared/hooks/useActivities'
import type { ActivityDto } from '../../shared/api/dto'

export default function MyActivitiesPage() {
  const { data, isLoading } = useMyActivities()

  const items: ActivityDto[] = data?.items ?? []

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>我负责的活动</Typography.Title>
        <Typography.Text type="secondary">管理招募、签到、结项</Typography.Text>
      </div>
      <Card>
        <Spin spinning={isLoading}>
          {items.length === 0 ? (
            <Empty description="暂无活动" />
          ) : (
            <Table
              rowKey="id"
              size="middle"
              dataSource={items}
              pagination={{ pageSize: 8 }}
              columns={[
                {
                  title: '活动名称',
                  dataIndex: 'title',
                  render: (v: string, row: ActivityDto) => (
                    <Space>
                      <ActivityStatusTag status={row.status} />
                      <Link to={`/activities/${row.id}`}>{v}</Link>
                    </Space>
                  ),
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 100,
                  render: (v: string) => <ActivityStatusTag status={v as never} />,
                },
                { title: '开始时间', dataIndex: 'startAt', width: 160 },
                {
                  title: '已报名',
                  key: 'count',
                  width: 100,
                  render: (_: unknown, row: ActivityDto) => `${row.registeredCount}/${row.capacity}`,
                },
                {
                  title: '操作',
                  key: 'action',
                  width: 320,
                  render: (_: unknown, row: ActivityDto) => (
                    <Space>
                      <Link to={`/activities/${row.id}/recruitment`}>
                        <Button size="small">招募管理</Button>
                      </Link>
                      <Link to={`/activities/${row.id}/registrations`}>
                        <Button size="small">报名审核</Button>
                      </Link>
                      <Link to={`/activities/${row.id}/checkin`}>
                        <Button size="small">签到</Button>
                      </Link>
                      <Link to={`/activities/${row.id}/closure`}>
                        <Button size="small" type="primary">
                          结项
                        </Button>
                      </Link>
                    </Space>
                  ),
                },
              ]}
            />
          )}
        </Spin>
      </Card>
    </Space>
  )
}
