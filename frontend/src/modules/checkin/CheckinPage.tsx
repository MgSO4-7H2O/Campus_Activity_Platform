import { CheckCircleTwoTone, PlusOutlined, QrcodeOutlined, ScanOutlined } from '@ant-design/icons'
import {
  Alert, Button, Card, Col, Empty, Form, Input, Modal, Row, Segmented, Space, Statistic, Table, Tabs, Tag, Typography, message,
} from 'antd'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { activities, checkinSessions as seed, type CheckinSession } from '../../shared/mock/data'

const METHOD_LABEL: Record<CheckinSession['method'], string> = {
  qrcode: '二维码',
  code: '签到码',
  manual: '手动签到',
}

export default function CheckinPage() {
  const { id } = useParams()
  const activity = activities.find((a) => a.id === id)
  const [sessions, setSessions] = useState<CheckinSession[]>(seed.filter((s) => s.activityId === id))
  const [createOpen, setCreateOpen] = useState(false)
  const [activeKey, setActiveKey] = useState<string>(sessions[0]?.id ?? '')

  const active = sessions.find((s) => s.id === activeKey)

  function createSession(values: { title: string; method: CheckinSession['method']; code?: string }) {
    const next: CheckinSession = {
      id: `sign-${Date.now()}`,
      activityId: id ?? '',
      title: values.title,
      method: values.method,
      code: values.code,
      startAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      endAt: '',
      signedCount: 0,
      totalCount: activity?.capacity ?? 0,
    }
    setSessions([next, ...sessions])
    setActiveKey(next.id)
    setCreateOpen(false)
    message.success('已创建签到场次')
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="活动签到"
        subtitle={activity ? `${activity.title} · 签到场次管理` : ''}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            创建签到场次
          </Button>
        }
      />

      {sessions.length === 0 ? (
        <Card>
          <Empty description="尚未创建任何签到场次" />
        </Card>
      ) : (
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={sessions.map((s) => ({
            key: s.id,
            label: (
              <Space>
                <Tag color="blue">{METHOD_LABEL[s.method]}</Tag>
                {s.title}
              </Space>
            ),
          }))}
        />
      )}

      {active && <SessionPanel session={active} />}

      <Modal
        title="创建签到场次"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        okText="创建"
        onOk={() =>
          Modal.info({
            title: '请直接在表单中创建',
          })
        }
        footer={null}
      >
        <Form layout="vertical" onFinish={createSession} initialValues={{ method: 'code' }}>
          <Form.Item name="title" label="场次名称" rules={[{ required: true }]}>
            <Input placeholder="如 Day 1 上午签到" />
          </Form.Item>
          <Form.Item name="method" label="签到方式" rules={[{ required: true }]}>
            <Segmented
              options={[
                { label: '二维码', value: 'qrcode', icon: <QrcodeOutlined /> },
                { label: '签到码', value: 'code', icon: <ScanOutlined /> },
                { label: '手动签到', value: 'manual' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="code"
            label="签到码（仅签到码方式需要）"
            rules={[{ pattern: /^\d{4,8}$/, message: '4-8 位数字' }]}
          >
            <Input placeholder="自动生成或手动输入，4-8 位数字" />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            确定创建
          </Button>
        </Form>
      </Modal>
    </Space>
  )
}

function SessionPanel({ session }: { session: CheckinSession }) {
  const rate = Math.round((session.signedCount / Math.max(session.totalCount, 1)) * 100)
  return (
    <Row gutter={16}>
      <Col xs={24} lg={10}>
        <Card title={`${session.title} · ${METHOD_LABEL[session.method]}`}>
          {session.method === 'code' && (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 12 }}
              message="签到码"
              description={
                <Typography.Title level={2} style={{ margin: 0, letterSpacing: 6 }}>
                  {session.code}
                </Typography.Title>
              }
            />
          )}
          {session.method === 'qrcode' && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
              <QrcodeOutlined style={{ fontSize: 160, color: '#1677ff' }} />
              <Typography.Text type="secondary" style={{ marginLeft: 16 }}>
                请使用 App 扫描二维码签到
              </Typography.Text>
            </div>
          )}
          <Space size={32} style={{ marginTop: 16 }}>
            <Statistic title="已签到" value={session.signedCount} suffix={`/ ${session.totalCount}`} />
            <Statistic title="签到率" value={rate} suffix="%" />
          </Space>
        </Card>
      </Col>

      <Col xs={24} lg={14}>
        <Card title="签到记录">
          <Table
            size="small"
            rowKey="id"
            pagination={{ pageSize: 6 }}
            dataSource={fakeRecords(session.signedCount)}
            columns={[
              { title: '姓名', dataIndex: 'name' },
              { title: '学院', dataIndex: 'college' },
              { title: '签到时间', dataIndex: 'at' },
              {
                title: '状态',
                dataIndex: 'state',
                render: () => (
                  <span>
                    <CheckCircleTwoTone twoToneColor="#52c41a" /> 已签到
                  </span>
                ),
              },
            ]}
          />
        </Card>
      </Col>
    </Row>
  )
}

function fakeRecords(n: number) {
  return Array.from({ length: Math.min(n, 12) }).map((_, i) => ({
    id: i,
    name: ['王宇晗', '李明', '赵小红', '钱小雨', '吴若楠'][i % 5],
    college: ['计算机学院', '机械学院', '外国语学院'][i % 3],
    at: `2026-05-25 09:${String(i).padStart(2, '0')}`,
    state: 'signed',
  }))
}
