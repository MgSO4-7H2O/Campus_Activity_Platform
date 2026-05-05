import { ClockCircleOutlined } from '@ant-design/icons'
import { Badge, Button, Card, Input, Space, Table, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { reviewerInbox } from '../../shared/mock/data'

export default function ReviewerInboxPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')

  const data = useMemo(
    () => reviewerInbox.filter((t) => (keyword ? t.title.includes(keyword) || t.organizationName.includes(keyword) : true)),
    [keyword]
  )

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={
          <Space>
            立项审核待办
            <Badge count={reviewerInbox.length} />
          </Space>
        }
        subtitle="按提交时间排序，点击进入审核详情"
      />

      <Card>
        <Space style={{ marginBottom: 12 }}>
          <Input.Search placeholder="搜索活动名称 / 组织" style={{ width: 280 }} onSearch={setKeyword} allowClear />
          <Button>仅看一级审核</Button>
          <Button>仅看二级及以上</Button>
        </Space>

        <Table
          size="middle"
          rowKey="applicationId"
          dataSource={data}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: '活动名称',
              dataIndex: 'title',
              render: (v: string, row) => (
                <Typography.Link onClick={() => navigate(`/approvals/${row.applicationId}`)}>{v}</Typography.Link>
              ),
            },
            { title: '发起组织', dataIndex: 'organizationName' },
            { title: '负责人', dataIndex: 'organizerName', width: 110 },
            { title: '审核层级', dataIndex: 'level', width: 100, render: (l: number) => <Tag color="purple">第 {l} 级</Tag> },
            {
              title: '提交时间',
              dataIndex: 'submittedAt',
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
                <Button type="primary" size="small" onClick={() => navigate(`/approvals/${row.applicationId}`)}>
                  立即审核
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}
