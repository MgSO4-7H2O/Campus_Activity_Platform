import { Button, Card, Empty, Space, Table, Tag, message } from 'antd'
import { useState } from 'react'

import PageHeader from '../../shared/components/PageHeader'
import { ApplicationStatusTag } from '../../shared/components/StatusTag'
import { myRoleApplications, type RoleApplication } from '../../shared/mock/data'

export default function RoleApplicationReviewPage() {
  const [list, setList] = useState<RoleApplication[]>(myRoleApplications)

  function decide(item: RoleApplication, decision: 'approved' | 'rejected') {
    setList((cur) => cur.map((r) => (r.id === item.id ? { ...r, status: decision } : r)))
    message.success(`已${decision === 'approved' ? '通过' : '驳回'}`)
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="权限申请审核" subtitle="处理 ORGANIZER / REVIEWER / SYS_ADMIN 申请" />
      <Card>
        {list.length === 0 ? (
          <Empty />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            dataSource={list}
            pagination={false}
            columns={[
              { title: '申请角色', dataIndex: 'appliedRole', render: (v: string) => <Tag color="blue">{v}</Tag> },
              { title: '组织', dataIndex: 'organizationName', render: (v?: string) => v ?? '-' },
              { title: '理由', dataIndex: 'reason', ellipsis: true },
              { title: '提交时间', dataIndex: 'submittedAt' },
              {
                title: '状态',
                dataIndex: 'status',
                render: (v) => <ApplicationStatusTag status={v} />,
              },
              {
                title: '操作',
                key: 'action',
                width: 200,
                render: (_, row) =>
                  row.status === 'submitted' ? (
                    <Space>
                      <Button size="small" type="primary" onClick={() => decide(row, 'approved')}>
                        通过
                      </Button>
                      <Button size="small" danger onClick={() => decide(row, 'rejected')}>
                        驳回
                      </Button>
                    </Space>
                  ) : (
                    <Tag>已处理</Tag>
                  ),
              },
            ]}
          />
        )}
      </Card>
    </Space>
  )
}
