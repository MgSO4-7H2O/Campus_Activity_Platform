import { Card, Empty, List, Space, Spin, Tabs, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useMyPendingTasks } from '../../shared/hooks/usePendingTasks'
import type {
  PendingTaskDto,
  PendingTaskResourceType,
  PendingTaskStatus,
} from '../../shared/api/dto'

const RES_LABEL: Record<PendingTaskResourceType, string> = {
  ROLE_APPLICATION: '权限申请',
  ACTIVITY_APPLICATION: '活动立项',
  CLOSURE_APPLICATION: '结项申请',
  RECRUITMENT_SIGNUP: '报名审核',
}

const RES_COLOR: Record<PendingTaskResourceType, string> = {
  ROLE_APPLICATION: 'purple',
  ACTIVITY_APPLICATION: 'blue',
  CLOSURE_APPLICATION: 'cyan',
  RECRUITMENT_SIGNUP: 'gold',
}

export default function TasksPage() {
  const [filter, setFilter] = useState<PendingTaskStatus>('PENDING')
  const { data: tasks = [], isLoading } = useMyPendingTasks()

  const filtered = useMemo(
    () => tasks.filter((t: PendingTaskDto) => t.status === filter),
    [tasks, filter],
  )

  const counts = useMemo(
    () => ({
      PENDING: tasks.filter((t: PendingTaskDto) => t.status === 'PENDING').length,
      PROCESSED: tasks.filter((t: PendingTaskDto) => t.status === 'PROCESSED').length,
      CANCELLED: tasks.filter((t: PendingTaskDto) => t.status === 'CANCELLED').length,
    }),
    [tasks],
  )

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>我的待办</Typography.Title>
        <Typography.Text type="secondary">
          所有审核、待补材料、待签到等任务统一在此查看，点击跳转到对应业务页面。
        </Typography.Text>
      </div>

      <Card>
        <Tabs
          activeKey={filter}
          onChange={(k) => setFilter(k as PendingTaskStatus)}
          items={[
            { key: 'PENDING', label: `待处理 (${counts.PENDING})` },
            { key: 'PROCESSED', label: `已处理 (${counts.PROCESSED})` },
            { key: 'CANCELLED', label: `已取消 (${counts.CANCELLED})` },
          ]}
        />
        {isLoading ? (
          <Spin style={{ display: 'block', textAlign: 'center', padding: 24 }} />
        ) : filtered.length === 0 ? (
          <Empty description="暂无待办" />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={filtered}
            renderItem={(t) => (
              <List.Item
                key={t.id}
                extra={
                  t.link ? (
                    <Link to={t.link}>前往处理 →</Link>
                  ) : (
                    <span style={{ color: '#999' }}>无跳转链接</span>
                  )
                }
              >
                <List.Item.Meta
                  title={
                    <Space size={8}>
                      <Tag color={RES_COLOR[t.relatedResourceType]}>
                        {RES_LABEL[t.relatedResourceType]}
                      </Tag>
                      <Typography.Text strong>{t.title}</Typography.Text>
                    </Space>
                  }
                  description={t.description}
                />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  创建：{new Date(t.createdAt).toLocaleString('zh-CN')}
                  {t.processedAt
                    ? ` · 已处理：${new Date(t.processedAt).toLocaleString('zh-CN')}`
                    : ''}
                </Typography.Text>
              </List.Item>
            )}
          />
        )}
      </Card>
    </Space>
  )
}
