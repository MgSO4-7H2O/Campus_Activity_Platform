import { Card, DatePicker, message, Select, Space, Table, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'

import PageHeader from '../../shared/components/PageHeader'
import { useSystemLogs } from '../../shared/hooks/useAdmin'
import type { SystemLogAction, SystemLogDto } from '../../shared/api/dto'

const ACTION_OPTIONS: { value: SystemLogAction; label: string }[] = [
  { value: 'AUTH_LOGIN', label: '登录' },
  { value: 'AUTH_REGISTER', label: '注册' },
  { value: 'ROLE_APPLICATION_SUBMIT', label: '权限申请提交' },
  { value: 'ROLE_APPLICATION_REVIEW', label: '权限申请审批' },
  { value: 'ACTIVITY_APPLICATION_SUBMIT', label: '立项提交' },
  { value: 'ACTIVITY_APPLICATION_REVIEW', label: '立项审核' },
  { value: 'SIGNUP_REVIEW', label: '报名审核' },
  { value: 'CHECKIN_OPEN', label: '签到开启' },
  { value: 'CLOSURE_REVIEW', label: '结项审核' },
  { value: 'ANNOUNCEMENT_PUBLISH', label: '公告发布' },
]

const ACTION_LABEL: Record<SystemLogAction, string> = Object.fromEntries(
  ACTION_OPTIONS.map((o) => [o.value, o.label])
) as Record<SystemLogAction, string>

export default function AdminSystemLogsPage() {
  const [actionFilter, setActionFilter] = useState<SystemLogAction | undefined>()
  const [range, setRange] = useState<[string?, string?]>([])

  const { data, isLoading, error } = useSystemLogs({
    action: actionFilter,
    from: range[0],
    to: range[1],
    pageSize: 100,
  })

  useEffect(() => {
    if (error) message.error('加载系统日志失败')
  }, [error])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="系统日志"
        subtitle="登录、审批、签到、公告等关键操作的审计日志。"
      />
      <Card>
        <Space style={{ marginBottom: 12 }} wrap>
          <Select
            allowClear
            placeholder="操作类型"
            style={{ width: 200 }}
            options={ACTION_OPTIONS}
            value={actionFilter}
            onChange={setActionFilter}
          />
          <DatePicker.RangePicker
            showTime
            onChange={(_, fmt) =>
              setRange([fmt[0] || undefined, fmt[1] || undefined])
            }
          />
        </Space>
        <Table<SystemLogDto>
          rowKey="id"
          size="small"
          loading={isLoading}
          dataSource={data?.items ?? []}
          pagination={{ pageSize: 20 }}
          columns={[
            {
              title: '时间',
              dataIndex: 'createdAt',
              width: 180,
              render: (v: string) => new Date(v).toLocaleString('zh-CN'),
            },
            {
              title: '操作',
              dataIndex: 'action',
              width: 160,
              render: (v: SystemLogAction) => (
                <Tag color="blue">{ACTION_LABEL[v] ?? v}</Tag>
              ),
            },
            { title: '操作人', dataIndex: 'actorName', render: (v) => v ?? '系统' },
            {
              title: '资源',
              key: 'resource',
              render: (_, r) =>
                r.resourceType ? `${r.resourceType}#${r.resourceId}` : '-',
            },
            { title: 'IP', dataIndex: 'ip', render: (v) => v ?? '-' },
            {
              title: '详情',
              dataIndex: 'detail',
              render: (v: unknown) =>
                v ? (
                  <Typography.Text code style={{ fontSize: 12 }}>
                    {JSON.stringify(v)}
                  </Typography.Text>
                ) : (
                  '-'
                ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}
