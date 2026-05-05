import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Empty, Input, Segmented, Space, Table, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { ApplicationStatusTag } from '../../shared/components/StatusTag'
import { myApplications, orgs, type ApplicationStatus } from '../../shared/mock/data'

type Filter = 'all' | 'in_progress' | 'done'

const FILTER_TO_STATUSES: Record<Filter, ApplicationStatus[]> = {
  all: ['draft', 'submitted', 'approving', 'need_more', 'rejected', 'approved', 'archived'],
  in_progress: ['draft', 'submitted', 'approving', 'need_more'],
  done: ['rejected', 'approved', 'archived'],
}

export default function MyApplicationsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [keyword, setKeyword] = useState('')

  const dataSource = useMemo(() => {
    return myApplications
      .filter((a) => FILTER_TO_STATUSES[filter].includes(a.status))
      .filter((a) => (keyword ? a.title.includes(keyword) : true))
  }, [filter, keyword])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="我的申请"
        subtitle="查看你提交的活动立项申请及审核进度"
        extra={
          <>
            <Button icon={<ReloadOutlined />}>刷新</Button>
            <Link to="/applications/new">
              <Button type="primary" icon={<PlusOutlined />}>
                新建立项申请
              </Button>
            </Link>
          </>
        }
      />

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

        <Table
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
              dataIndex: 'organizationId',
              render: (v: string) => orgs.find((o) => o.id === v)?.name ?? v,
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 120,
              render: (v: ApplicationStatus) => <ApplicationStatusTag status={v} />,
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
                  {row.status === 'draft' && (
                    <Link to={`/applications/${row.id}/edit`}>
                      <Tag color="blue" style={{ cursor: 'pointer' }}>
                        继续编辑
                      </Tag>
                    </Link>
                  )}
                  {row.status === 'need_more' && (
                    <Tag color="orange" style={{ cursor: 'pointer' }}>
                      补充材料
                    </Tag>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}
