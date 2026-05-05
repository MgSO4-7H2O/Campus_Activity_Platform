import { Button, Card, Empty, Space, Table, Tag } from 'antd'
import { Link } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { ActivityStatusTag } from '../../shared/components/StatusTag'
import { activities, recruitments } from '../../shared/mock/data'

export default function MyActivitiesPage() {
  // 演示用：列出所有活动作为我负责的活动。
  const data = activities

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="我负责的活动" subtitle="管理招募、签到、结项" />
      <Card>
        {data.length === 0 ? (
          <Empty description="暂无活动" />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            dataSource={data}
            pagination={{ pageSize: 8 }}
            columns={[
              {
                title: '活动名称',
                dataIndex: 'title',
                render: (v: string, row) => (
                  <Space>
                    <ActivityStatusTag status={row.status} />
                    <Link to={`/activities/${row.id}`}>{v}</Link>
                  </Space>
                ),
              },
              {
                title: '招募状态',
                key: 'rec',
                render: (_, row) => {
                  const r = recruitments[row.id]
                  return r ? <Tag color={r.status === 'published' ? 'green' : 'default'}>{r.status}</Tag> : <Tag>未创建</Tag>
                },
              },
              { title: '开始时间', dataIndex: 'startAt' },
              {
                title: '已报名',
                key: 'count',
                render: (_, row) => `${row.registered}/${row.capacity}`,
              },
              {
                title: '操作',
                key: 'action',
                width: 320,
                render: (_, row) => (
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
      </Card>
    </Space>
  )
}
