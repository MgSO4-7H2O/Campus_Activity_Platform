import { CheckCircleOutlined, MailOutlined, NotificationOutlined } from '@ant-design/icons'
import { Badge, Button, Card, List, Segmented, Space, Tag, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { notifications as seedNotifications, type NotificationItem } from '../../shared/mock/data'
import PageHeader from '../../shared/components/PageHeader'

const TYPE_LABEL: Record<NotificationItem['type'], string> = {
  flow: '流程',
  announce: '公告',
  system: '系统',
}

const TYPE_COLOR: Record<NotificationItem['type'], string> = {
  flow: 'blue',
  announce: 'green',
  system: 'orange',
}

export default function NotificationCenterPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [list, setList] = useState<NotificationItem[]>(seedNotifications)

  const filtered = useMemo(() => {
    return filter === 'unread' ? list.filter((n) => !n.read) : list
  }, [list, filter])

  const unreadCount = list.filter((n) => !n.read).length

  function markRead(id: string) {
    setList((cur) => cur.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  function markAllRead() {
    setList((cur) => cur.map((n) => ({ ...n, read: true })))
    message.success('已全部标记为已读')
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={
          <Space>
            通知中心
            <Badge count={unreadCount} />
          </Space>
        }
        subtitle="流程通知与系统消息"
        extra={
          <Button icon={<CheckCircleOutlined />} onClick={markAllRead} disabled={unreadCount === 0}>
            全部标为已读
          </Button>
        }
      />

      <Card>
        <Segmented
          value={filter}
          onChange={(v) => setFilter(v as 'all' | 'unread')}
          options={[
            { label: `全部 (${list.length})`, value: 'all' },
            { label: `未读 (${unreadCount})`, value: 'unread' },
          ]}
        />

        <List
          style={{ marginTop: 12 }}
          dataSource={filtered}
          locale={{ emptyText: '暂无通知' }}
          renderItem={(item) => (
            <List.Item
              actions={[
                item.link && (
                  <Link key="link" to={item.link} onClick={() => markRead(item.id)}>
                    查看详情
                  </Link>
                ),
                !item.read && (
                  <Button key="read" size="small" type="link" onClick={() => markRead(item.id)}>
                    标为已读
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Badge dot={!item.read} offset={[-4, 4]}>
                    {item.type === 'flow' ? <MailOutlined style={{ fontSize: 22 }} /> : <NotificationOutlined style={{ fontSize: 22 }} />}
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
      </Card>
    </Space>
  )
}
