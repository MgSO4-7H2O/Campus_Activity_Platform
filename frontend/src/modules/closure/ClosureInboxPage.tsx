import { Button, Card, Space, Table } from 'antd'
import { Link } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { ApplicationStatusTag } from '../../shared/components/StatusTag'
import { closures } from '../../shared/mock/data'

export default function ClosureInboxPage() {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="结项待审" subtitle="按提交时间排序，点击进入审核详情" />
      <Card>
        <Table
          rowKey="id"
          size="middle"
          dataSource={closures}
          pagination={false}
          columns={[
            { title: '活动名称', dataIndex: 'activityTitle' },
            { title: '申请人', dataIndex: 'applicantName' },
            { title: '提交时间', dataIndex: 'submittedAt' },
            {
              title: '状态',
              dataIndex: 'status',
              render: (v) => <ApplicationStatusTag status={v} />,
            },
            {
              title: '操作',
              key: 'action',
              render: (_, row) => (
                <Link to={`/closures/${row.id}/review`}>
                  <Button size="small" type="primary">
                    立即审核
                  </Button>
                </Link>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}
