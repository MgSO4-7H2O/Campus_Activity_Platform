import { CheckCircleOutlined, MailOutlined, NotificationOutlined } from '@ant-design/icons'
import { Badge, Button, Card, Empty, List, Segmented, Space, Spin, Tag, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useNotifications, useMarkRead, useMarkAllRead } from '../../shared/hooks/useNotifications'
import type { NotificationType } from '../../shared/api/dto'

const TYPE_LABEL: Record<NotificationType, string> = {
  FLOW: '流程',
  ANNOUNCE: '公告',
  SYSTEM: '系统',
}

const TYPE_COLOR: Record<NotificationType, string> = {
  FLOW: 'blue',
  ANNOUNCE: 'green',
  SYSTEM: 'orange',
}

export default function NotificationCenterPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const { data: page, isLoading, refetch } = useNotifications()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const list = page?.items ?? []

  const filtered = useMemo(() => {
    return filter === 'unread' ? list.filter((n) => !n.read) : list
  }, [list, filter])

  const unreadCount = list.filter((n) => !n.read).length

  async function handleMarkRead(id: string) {
    await markRead.mutateAsync(id, {
      onSuccess: () => refetch(),
      onError: () => message.error('标记已读失败'),
    })
  }

  async function handleMarkAllRead() {
    await markAllRead.mutateAsync(undefined, {
      onSuccess: () => {
        refetch()
        message.success('已全部标记为已读')
      },
      onError: () => message.error('操作失败'),
    })
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Space>
            <Typography.Title level={3} style={{ margin: 0 }}>通知中心</Typography.Title>
            <Badge count={unreadCount} />
          </Space>
          <br />
          <Typography.Text type="secondary">流程通知与系统消息</Typography.Text>
        </div>
        <Button
          icon={<CheckCircleOutlined />}
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          loading={markAllRead.isPending}
        >
          全部标为已读
        </Button>
      </div>

      <Card>
        <Segmented
          value={filter}
          onChange={(v) => setFilter(v as 'all' | 'unread')}
          options={[
            { label: `全部 (${list.length})`, value: 'all' },
            { label: `未读 (${unreadCount})`, value: 'unread' },
          ]}
        />

        <Spin spinning={isLoading}>
          <List
            style={{ marginTop: 12 }}
            dataSource={filtered}
            locale={{ emptyText: <Empty description="暂无通知" /> }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  item.link && (
                    <Link key="link" to={item.link} onClick={() => handleMarkRead(item.id)}>
                      查看详情
                    </Link>
                  ),
                  !item.read && (
                    <Button
                      key="read"
                      size="small"
                      type="link"
                      loading={markRead.isPending}
                      onClick={() => handleMarkRead(item.id)}
                    >
                      标为已读
                    </Button>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot={!item.read} offset={[-4, 4]}>
                      {item.type === 'FLOW' ? (
                        <MailOutlined style={{ fontSize: 22 }} />
                      ) : (
                        <NotificationOutlined style={{ fontSize: 22 }} />
                      )}
                    </Badge>
                  }
                  title={
                    <Space>
                      <Tag color={TYPE_COLOR[item.type]}>{TYPE_LABEL[item.type]}</Tag>
                      <Typography.Text strong={!item.read}>{item.title}</Typography.Text>
                    </Space>
                  }
                  description={
                    <>
                      <Typography.Paragraph type="secondary" style={{ marginBottom: 4 }}>
                        {item.body}
                      </Typography.Paragraph>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {item.createdAt}
                      </Typography.Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </Spin>
      </Card>
    </Space>
  )
}
