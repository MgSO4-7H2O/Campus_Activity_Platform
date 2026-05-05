import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, List, Modal, Select, Space, Tag, Typography, message } from 'antd'
import { useState } from 'react'

import PageHeader from '../../shared/components/PageHeader'
import { announcements as seed, type Announcement } from '../../shared/mock/data'

export default function AnnouncementManagePage() {
  const [list, setList] = useState<Announcement[]>(seed)
  const [open, setOpen] = useState(false)

  function publish(values: Pick<Announcement, 'title' | 'category' | 'excerpt'>) {
    const next: Announcement = {
      id: `a-${Date.now()}`,
      title: values.title,
      category: values.category,
      excerpt: values.excerpt,
      publishedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      author: '系统管理员',
    }
    setList([next, ...list])
    setOpen(false)
    message.success('已发布')
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
                    <Tag color="blue">{item.category}</Tag>
                    {item.pinned && <Tag color="red">置顶</Tag>}
                    <Typography.Text strong>{item.title}</Typography.Text>
                  </Space>
                }
                description={
                  <>
                    <Typography.Text type="secondary">
                      {item.author} · {item.publishedAt}
                    </Typography.Text>
                    <Typography.Paragraph style={{ marginTop: 4, marginBottom: 0 }}>{item.excerpt}</Typography.Paragraph>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal title="发布公告" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form layout="vertical" onFinish={publish}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类" initialValue="通知" rules={[{ required: true }]}>
            <Select
              options={[
                { value: '新闻', label: '新闻' },
                { value: '通知', label: '通知' },
                { value: '活动', label: '活动' },
              ]}
            />
          </Form.Item>
          <Form.Item name="excerpt" label="正文摘要" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            发布
          </Button>
        </Form>
      </Modal>
    </Space>
  )
}
