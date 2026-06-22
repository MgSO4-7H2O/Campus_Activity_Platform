import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Empty, Input, Segmented, Space, Spin, Table, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApplicationStatusTag } from '../../shared/components/StatusTag'
import { useMyApplications } from '../../shared/hooks/useActivityApplications'
import type { ActivityApplicationDto, ActivityApplicationStatus } from '../../shared/api/dto'

type Filter = 'all' | 'in_progress' | 'done'

const FILTER_TO_STATUSES: Record<Filter, ActivityApplicationStatus[]> = {
  all: ['DRAFT', 'SUBMITTED', 'APPROVING', 'NEED_MORE', 'REJECTED', 'APPROVED', 'ARCHIVED'],
  in_progress: ['DRAFT', 'SUBMITTED', 'APPROVING', 'NEED_MORE'],
  done: ['REJECTED', 'APPROVED', 'ARCHIVED'],
}

export default function MyApplicationsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [keyword, setKeyword] = useState('')

  const { data, isLoading, refetch } = useMyApplications()

  const dataSource = useMemo(() => {
    return ((data?.items ?? []) as ActivityApplicationDto[])
      .filter((a: ActivityApplicationDto) => FILTER_TO_STATUSES[filter].includes(a.status))
      .filter((a: ActivityApplicationDto) => (keyword ? a.title.includes(keyword) : true))
  }, [data, filter, keyword])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>我的申请</Typography.Title>
          <Typography.Text type="secondary">查看你提交的活动立项申请及审核进度</Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>刷新</Button>
          <Link to="/applications/new">
            <Button type="primary" icon={<PlusOutlined />}>
              新建立项申请
            </Button>
          </Link>
        </Space>
      </div>

      <Card>
        <Space wrap style={{ marginBottom: 12 }}>
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
            options={[
              { label: '全部', value: 'all' },
              { label: '进行中', value: 'in_progress' },
              { label: '已结束', value: 'done' },
            ]}
          />
          <Input.Search
            placeholder="搜索活动名称"
            allowClear
            style={{ width: 240 }}
            onSearch={setKeyword}
          />
        </Space>

        <Spin spinning={isLoading}>
          <Table<ActivityApplicationDto>
            size="middle"
            rowKey="id"
            dataSource={dataSource}
            pagination={{ pageSize: 8 }}
            locale={{ emptyText: <Empty description="暂无申请" /> }}
            columns={[
              {
                title: '活动名称',
                dataIndex: 'title',
                render: (v: string, row) => (
                  <Typography.Link onClick={() => navigate(`/applications/${row.id}`)}>{v}</Typography.Link>
                ),
              },
              {
                title: '发起组织',
                dataIndex: 'organizationName',
              },
              {
                title: '状态',
                dataIndex: 'status',
                width: 120,
                render: (v: ActivityApplicationStatus) => <ApplicationStatusTag status={v} />,
              },
              { title: '预计开始', dataIndex: 'expectedStart', width: 160 },
              { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
              {
                title: '操作',
                key: 'action',
                width: 220,
                render: (_, row) => (
                  <Space>
                    <Link to={`/applications/${row.id}`}>查看</Link>
                    {row.status === 'DRAFT' && (
                      <Link to={`/applications/${row.id}`}>
                        <Typography.Text type="warning" style={{ cursor: 'pointer' }}>
                          前往提交
                        </Typography.Text>
                      </Link>
                    )}
                    {row.status === 'NEED_MORE' && (
                      <Typography.Text type="warning">
                        需补充材料
                      </Typography.Text>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        </Spin>
      </Card>
    </Space>
  )
}
