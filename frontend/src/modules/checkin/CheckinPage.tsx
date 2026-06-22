import { CheckCircleTwoTone, PlusOutlined, QrcodeOutlined, ScanOutlined } from '@ant-design/icons'
import {
  Alert, Button, Card, Col, Empty, Form, Input, Modal, Row, Segmented, Space, Spin, Statistic, Table, Tabs, Tag, Typography, message,
} from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import {
  closeCheckinSession,
  createCheckinSession,
  getActivity,
  listCheckinRecords,
  listCheckinSessions,
  manualCheckin,
  openCheckinSession,
} from '../../shared/api'
import { getApiErrorMessage } from '../../shared/api/error'
import type {
  ActivityDto,
  CheckinMethod,
  CheckinRecordDto,
  CheckinSessionDto,
} from '../../shared/api/dto'

const METHOD_LABEL: Record<CheckinMethod, string> = {
  QRCODE: '二维码',
  CODE: '签到码',
  MANUAL: '手动签到',
}

const STATUS_LABEL: Record<CheckinSessionDto['status'], { text: string; color: string }> = {
  DRAFT: { text: '未开始', color: 'default' },
  OPEN: { text: '签到中', color: 'green' },
  CLOSED: { text: '已结束', color: 'red' },
}

export default function CheckinPage() {
  const { id } = useParams()
  const activityId = id ?? ''
  const [activity, setActivity] = useState<ActivityDto | null>(null)
  const [sessions, setSessions] = useState<CheckinSessionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [activeKey, setActiveKey] = useState<string>('')

  const loadSessions = useCallback(async () => {
    if (!activityId) return
    setLoading(true)
    try {
      const data = await listCheckinSessions(activityId)
      setSessions(data)
      setActiveKey((prev) => (prev && data.some((s) => s.id === prev) ? prev : data[0]?.id ?? ''))
    } catch (err) {
      message.error(getApiErrorMessage(err, '加载签到场次失败'))
    } finally {
      setLoading(false)
    }
  }, [activityId])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  useEffect(() => {
    if (!activityId) return
    getActivity(activityId)
      .then(setActivity)
      .catch(() => setActivity(null))
  }, [activityId])

  async function createSession(values: { title: string; method: CheckinMethod }) {
    setCreating(true)
    try {
      const now = new Date()
      const end = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      const created = await createCheckinSession({
        activityId,
        title: values.title,
        method: values.method,
        startAt: now.toISOString(),
        endAt: end.toISOString(),
      })
      setCreateOpen(false)
      message.success('已创建签到场次')
      await loadSessions()
      setActiveKey(created.id)
    } catch (err) {
      message.error(getApiErrorMessage(err, '创建签到场次失败'))
    } finally {
      setCreating(false)
    }
  }

  const active = sessions.find((s) => s.id === activeKey)

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="活动签到"
        subtitle={activity ? `${activity.title} · 签到场次管理` : '签到场次管理'}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            创建签到场次
          </Button>
        }
      />

      {loading ? (
        <Card>
          <Spin />
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <Empty description="尚未创建任何签到场次" />
        </Card>
      ) : (
        <>
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
          {active && <SessionPanel session={active} onChanged={loadSessions} />}
        </>
      )}

      <Modal
        title="创建签到场次"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={createSession} initialValues={{ method: 'CODE' }}>
          <Form.Item name="title" label="场次名称" rules={[{ required: true, message: '请输入场次名称' }]}>
            <Input placeholder="如 Day 1 上午签到" />
          </Form.Item>
          <Form.Item name="method" label="签到方式" rules={[{ required: true }]}>
            <Segmented
              options={[
                { label: '二维码', value: 'QRCODE', icon: <QrcodeOutlined /> },
                { label: '签到码', value: 'CODE', icon: <ScanOutlined /> },
                { label: '手动签到', value: 'MANUAL' },
              ]}
            />
          </Form.Item>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            签到码 / 二维码由系统自动生成，创建后可在场次面板查看。
          </Typography.Text>
          <div style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" loading={creating}>
              确定创建
            </Button>
          </div>
        </Form>
      </Modal>
    </Space>
  )
}

function SessionPanel({ session, onChanged }: { session: CheckinSessionDto; onChanged: () => Promise<void> | void }) {
  const [records, setRecords] = useState<CheckinRecordDto[]>([])
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualSubmitting, setManualSubmitting] = useState(false)

  const loadRecords = useCallback(async () => {
    setRecordsLoading(true)
    try {
      setRecords(await listCheckinRecords(session.id))
    } catch (err) {
      message.error(getApiErrorMessage(err, '加载签到记录失败'))
    } finally {
      setRecordsLoading(false)
    }
  }, [session.id])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  async function toggleStatus() {
    setToggling(true)
    try {
      if (session.status === 'OPEN') {
        await closeCheckinSession(session.id)
        message.success('已关闭签到')
      } else {
        await openCheckinSession(session.id)
        message.success('已开启签到')
      }
      await onChanged()
    } catch (err) {
      message.error(getApiErrorMessage(err, '操作失败，请稍后再试'))
    } finally {
      setToggling(false)
    }
  }

  async function submitManual(values: { userId: string }) {
    setManualSubmitting(true)
    try {
      await manualCheckin(session.id, { userId: values.userId })
      setManualOpen(false)
      message.success('已补签')
      await Promise.all([loadRecords(), onChanged()])
    } catch (err) {
      message.error(getApiErrorMessage(err, '补签失败'))
    } finally {
      setManualSubmitting(false)
    }
  }

  const rate = Math.round((session.signedCount / Math.max(session.totalCount, 1)) * 100)
  const statusMeta = STATUS_LABEL[session.status]

  return (
    <Row gutter={16}>
      <Col xs={24} lg={10}>
        <Card
          title={
            <Space>
              {`${session.title} · ${METHOD_LABEL[session.method]}`}
              <Tag color={statusMeta.color}>{statusMeta.text}</Tag>
            </Space>
          }
          extra={
            <Space>
              <Button size="small" onClick={() => setManualOpen(true)}>
                手动补签
              </Button>
              <Button
                size="small"
                type={session.status === 'OPEN' ? 'default' : 'primary'}
                danger={session.status === 'OPEN'}
                loading={toggling}
                onClick={toggleStatus}
              >
                {session.status === 'OPEN' ? '关闭签到' : '开启签到'}
              </Button>
            </Space>
          }
        >
          {session.method === 'CODE' && session.code && (
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
          {session.method === 'QRCODE' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
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
        <Card title="签到记录" extra={<Button size="small" onClick={loadRecords}>刷新</Button>}>
          <Table
            size="small"
            rowKey="id"
            loading={recordsLoading}
            pagination={{ pageSize: 6 }}
            dataSource={records}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无签到记录" /> }}
            columns={[
              { title: '姓名', dataIndex: 'realName', render: (v: string | null) => v ?? '—' },
              {
                title: '签到方式',
                dataIndex: 'method',
                render: (m: CheckinMethod) => <Tag color="blue">{METHOD_LABEL[m]}</Tag>,
              },
              {
                title: '签到时间',
                dataIndex: 'checkedInAt',
                render: (v: string) => new Date(v).toLocaleString('zh-CN'),
              },
              {
                title: '状态',
                dataIndex: 'status',
                render: (s: CheckinRecordDto['status']) =>
                  s === 'LATE' ? (
                    <Tag color="orange">迟到</Tag>
                  ) : (
                    <span>
                      <CheckCircleTwoTone twoToneColor="#52c41a" /> 已签到
                    </span>
                  ),
              },
            ]}
          />
        </Card>
      </Col>

      <Modal
        title="手动补签"
        open={manualOpen}
        onCancel={() => setManualOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={submitManual}>
          <Form.Item
            name="userId"
            label="用户 ID"
            rules={[{ required: true, message: '请输入待补签用户的 ID' }]}
          >
            <Input placeholder="输入参与者用户 ID（UUID）" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={manualSubmitting}>
            确认补签
          </Button>
        </Form>
      </Modal>
    </Row>
  )
}
