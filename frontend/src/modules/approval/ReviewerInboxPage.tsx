import { ClockCircleOutlined } from '@ant-design/icons'
import { Badge, Button, Card, Empty, Input, Space, Spin, Table, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useMyPendingTasks } from '../../shared/hooks/usePendingTasks'
import type { PendingTaskDto } from '../../shared/api/dto'

export default function ReviewerInboxPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')

  const { data = [], isLoading, refetch } = useMyPendingTasks({
    status: 'PENDING',
  })

  const filtered = useMemo(
    () =>
      data.filter((t: PendingTaskDto) =>
        keyword
          ? t.title.includes(keyword) || (t.description ?? '').includes(keyword)
          : true
      ),
    [data, keyword],
  )

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Space>
            <Typography.Title level={3} style={{ margin: 0 }}>
              立项审核待办
            </Typography.Title>
            <Badge count={data.length} />
          </Space>
          <br />
          <Typography.Text type="secondary">按提交时间排序，点击进入审核详情</Typography.Text>
        </div>
        <Button onClick={() => refetch()}>刷新</Button>
      </div>

      <Card>
        <Space style={{ marginBottom: 12 }}>
          <Input.Search
            placeholder="搜索活动名称 / 描述"
            style={{ width: 280 }}
            onSearch={setKeyword}
            allowClear
          />
        </Space>

        <Spin spinning={isLoading}>
          <Table<PendingTaskDto>
            size="middle"
            rowKey="id"
            dataSource={filtered}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="暂无待办" /> }}
            columns={[
              {
                title: '标题',
                dataIndex: 'title',
                render: (v: string, row) => (
                  <Typography.Link onClick={() => navigate(`/approvals/${row.relatedResourceId}`)}>
                    {v}
                  </Typography.Link>
                ),
              },
              {
                title: '描述',
                dataIndex: 'description',
                render: (v: string | null) => v ?? '—',
              },
              {
                title: '类型',
                dataIndex: 'relatedResourceType',
                width: 130,
                render: (v: string) => {
                  const label: Record<string, string> = {
                    ROLE_APPLICATION: '角色申请',
                    ACTIVITY_APPLICATION: '活动立项',
                    CLOSURE_APPLICATION: '结项申请',
                    RECRUITMENT_SIGNUP: '报名审核',
                  }
                  return <Tag color="purple">{label[v] ?? v}</Tag>
                },
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
                width: 170,
                render: (v: string) => (
                  <Space size={4}>
                    <ClockCircleOutlined />
                    {v}
                  </Space>
                ),
              },
              {
                title: '操作',
                key: 'action',
                width: 110,
                render: (_, row) => (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => navigate(`/approvals/${row.relatedResourceId}`)}
                  >
                    立即审核
                  </Button>
                ),
              },
            ]}
          />
        </Spin>
      </Card>
    </Space>
  )
}
