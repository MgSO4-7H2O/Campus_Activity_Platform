import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, List, Modal, Select, Space, Spin, Tag, Typography, message } from 'antd'
import { useEffect, useState } from 'react'

import PageHeader from '../../shared/components/PageHeader'
import { useAnnouncements, useCreateAnnouncement, usePublishAnnouncement } from '../../shared/hooks/useAnnouncements'
import type { AnnouncementCategory } from '../../shared/api/dto'

const CATEGORY_LABEL: Record<string, string> = {
  NEWS: '新闻',
  NOTICE: '通知',
  RECRUITMENT: '活动',
  SYSTEM: '系统',
}

export default function AnnouncementManagePage() {
  const { data, isLoading, error } = useAnnouncements()
  const createMutation = useCreateAnnouncement()
  const publishMutation = usePublishAnnouncement()
  const [open, setOpen] = useState(false)

  const list = data?.items ?? []

  useEffect(() => {
    if (error) message.error('加载公告失败')
  }, [error])

  function handlePublish(values: { title: string; category: string; content: string }) {
    createMutation.mutate(
      { title: values.title, category: values.category as AnnouncementCategory, content: values.content },
      {
        onSuccess: (created) => {
          publishMutation.mutate(created.id, {
            onSuccess: () => {
              setOpen(false)
              message.success('已发布')
            },
            onError: () => message.error('发布失败'),
          })
        },
        onError: () => message.error('创建公告失败'),
      },
    )
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="公告管理"
        subtitle="发布与维护平台公告"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            发布公告
          </Button>
        }
      />
      <Card>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <List
            dataSource={list}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <a key="edit">编辑</a>,
                  <a key="del" style={{ color: '#ff4d4f' }}>
                    下架
                  </a>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color="blue">{CATEGORY_LABEL[item.category] ?? item.category}</Tag>
                      {item.pinned && <Tag color="red">置顶</Tag>}
                      <Typography.Text strong>{item.title}</Typography.Text>
                    </Space>
                  }
                  description={
                    <>
                      <Typography.Text type="secondary">
                        {item.authorName ?? '未知'} · {item.publishedAt}
                      </Typography.Text>
                      <Typography.Paragraph style={{ marginTop: 4, marginBottom: 0 }}>{item.content}</Typography.Paragraph>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal title="发布公告" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form layout="vertical" onFinish={handlePublish}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类" initialValue="NOTICE" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'NEWS', label: '新闻' },
                { value: 'NOTICE', label: '通知' },
                { value: 'RECRUITMENT', label: '活动' },
              ]}
            />
          </Form.Item>
          <Form.Item name="content" label="正文摘要" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
            发布
          </Button>
        </Form>
      </Modal>
    </Space>
  )
}
