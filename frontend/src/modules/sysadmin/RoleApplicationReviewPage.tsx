import { Button, Card, Empty, Space, Spin, Table, Tag, message } from 'antd'
import { useEffect } from 'react'

import PageHeader from '../../shared/components/PageHeader'
import { ApplicationStatusTag } from '../../shared/components/StatusTag'
import { useAdminRoleApplications, useReviewRoleApplication } from '../../shared/hooks/useAdmin'
import type { RoleApplicationDto } from '../../shared/api/dto'

export default function RoleApplicationReviewPage() {
  const { data, isLoading, error } = useAdminRoleApplications()
  const reviewMutation = useReviewRoleApplication()

  const list = data?.items ?? []

  useEffect(() => {
    if (error) {
      message.error('加载权限申请列表失败')
    }
  }, [error])

  function decide(item: RoleApplicationDto, decision: 'APPROVE' | 'REJECT') {
    reviewMutation.mutate(
      { id: item.id, body: { decision } },
      {
        onSuccess: () => {
          message.success(`已${decision === 'APPROVE' ? '通过' : '驳回'}`)
        },
        onError: () => {
          message.error('操作失败，请重试')
        },
      }
    )
  }

  if (isLoading) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <PageHeader title="权限申请审核" subtitle="处理 ORGANIZER / REVIEWER / SYS_ADMIN 申请" />
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        </Card>
      </Space>
    )
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
                  row.status === 'SUBMITTED' ? (
                    <Space>
                      <Button size="small" type="primary" loading={reviewMutation.isPending} onClick={() => decide(row, 'APPROVE')}>
                        通过
                      </Button>
                      <Button size="small" danger loading={reviewMutation.isPending} onClick={() => decide(row, 'REJECT')}>
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
