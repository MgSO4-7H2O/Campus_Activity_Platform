import { Button, Card, Space, Spin, Table, message } from 'antd'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { ApplicationStatusTag } from '../../shared/components/StatusTag'
import type { ClosureApplicationDto } from '../../shared/api/dto'
import { useMyClosureApplications } from '../../shared/hooks/useClosures'

export default function ClosureInboxPage() {
  const { data, isLoading, isError, error } = useMyClosureApplications()

  useEffect(() => {
    if (isError) {
      message.error(error instanceof Error ? error.message : '加载结项申请列表失败')
    }
  }, [isError, error])

  const dataSource = data?.items ?? []

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="结项待审" subtitle="按提交时间排序，点击进入审核详情" />
      <Card>
        <Spin spinning={isLoading}>
          <Table<ClosureApplicationDto>
            rowKey="id"
            size="middle"
            dataSource={dataSource}
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
        </Spin>
      </Card>
    </Space>
  )
}
