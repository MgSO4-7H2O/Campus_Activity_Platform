import { CheckCircleTwoTone, LoginOutlined, PlusOutlined, QrcodeOutlined, ScanOutlined } from '@ant-design/icons'
import {
  Alert, Button, Card, Col, Empty, Form, Input, Modal, Row, Segmented, Space, Spin, Statistic, Table, Tabs, Tag, Typography, message,
} from 'antd'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { openCheckinSession, closeCheckinSession, performCheckin } from '../../shared/api/checkin'
import { useActivity } from '../../shared/hooks/useActivities'
import { useCheckinRecords, useCheckinSessions, useCreateCheckinSession } from '../../shared/hooks/useCheckin'
import { useAuthStore, hasRole } from '../../shared/auth/store'
import type { CheckinMethod, CheckinRecordDto, CheckinSessionDto } from '../../shared/api/dto'

const METHOD_LABEL: Record<CheckinMethod, string> = {
  QRCODE: '二维码',
  CODE: '签到码',
  MANUAL: '手动签到',
}

export default function CheckinPage() {
  const { id } = useParams()
  const user = useAuthStore((s) => s.user)
  const isOrganizer = hasRole(user, 'ORGANIZER') || hasRole(user, 'SYS_ADMIN')
  const { data: activity } = useActivity(id)
  const { data: sessions, isLoading, isError, refetch } = useCheckinSessions(id)
  const createMutation = useCreateCheckinSession()
  const [createOpen, setCreateOpen] = useState(false)
  const [activeKey, setActiveKey] = useState<string>('')
  const [checkinCode, setCheckinCode] = useState('')
  const [checkingIn, setCheckingIn] = useState(false)

  useEffect(() => {
    if (sessions && sessions.length > 0 && !activeKey) {
      setActiveKey(sessions[0].id)
    }
  }, [sessions, activeKey])

  const active = sessions?.find((s) => s.id === activeKey)

  // ---------- 签到（学生 / 所有人）----------
  async function handleCheckin() {
    if (!checkinCode.trim()) {
      message.warning('请输入签到码')
      return
    }
    // 找到匹配签到码的场次
    const openSessions = (sessions ?? []).filter((s) => s.status === 'OPEN')
    if (openSessions.length === 0) {
      message.warning('当前没有开放的签到场次，请联系活动负责人')
      return
    }
    setCheckingIn(true)
    let success = false
    for (const session of openSessions) {
      try {
        await performCheckin(session.id, { code: checkinCode.trim() })
        message.success('签到成功！')
        setCheckinCode('')
        refetch()
        success = true
        break
      } catch {
        // 尝试下一个场次
      }
    }
    if (!success) {
      message.error('签到失败，请检查签到码是否正确')
    }
    setCheckingIn(false)
  }

  // ---------- 管理者创建场次 ----------
  function handleCreate(values: { title: string; method: CheckinMethod; code?: string }) {
    createMutation.mutate(
      {
        activityId: id ?? '',
        title: values.title,
        method: values.method,
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        onSuccess: (session) => {
          setActiveKey(session.id)
          setCreateOpen(false)
          message.success('已创建签到场次')
        },
        onError: () => {
          message.error('创建签到场次失败')
        },
      },
    )
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>活动签到</Typography.Title>
          <Typography.Text type="secondary">{activity?.title ?? ''}</Typography.Text>
        </div>
        <Space>
          <Input
            placeholder="输入签到码"
            value={checkinCode}
            onChange={(e) => setCheckinCode(e.target.value)}
            onPressEnter={handleCheckin}
            style={{ width: 160 }}
          />
          <Button type="primary" icon={<LoginOutlined />} loading={checkingIn} onClick={handleCheckin}>
            签到
          </Button>
          {isOrganizer && (
            <Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              新建场次
            </Button>
          )}
        </Space>
      </div>

      {isLoading ? (
        <Card><Spin style={{ display: 'block', textAlign: 'center', padding: 40 }} /></Card>
      ) : isError ? (
        <Card><Empty description="加载签到场次失败" /></Card>
      ) : !sessions || sessions.length === 0 ? (
        <Card>
          <Empty description={isOrganizer ? '暂未创建签到场次' : '暂无开放的签到场次'}>
            {isOrganizer && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                创建第一场签到
              </Button>
            )}
          </Empty>
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
                  <Tag color={s.status === 'OPEN' ? 'green' : 'default'}>{METHOD_LABEL[s.method]}</Tag>
                  {s.title}
                </Space>
              ),
            }))}
          />
          {active && <SessionPanel session={active} />}
        </>
      )}

      {/* ---------- 创建弹窗 ---------- */}
      <Modal title="创建签到场次" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null}>
        <Form layout="vertical" onFinish={handleCreate} initialValues={{ method: 'CODE' }}>
          <Form.Item name="title" label="场次名称" rules={[{ required: true }]}>
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
          <Form.Item name="code" label="签到码（签到码方式需要）" rules={[{ pattern: /^\d{4,8}$/, message: '4-8 位数字' }]}>
            <Input placeholder="自动生成或手动输入" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending}>确定创建</Button>
        </Form>
      </Modal>
    </Space>
  )
}

function SessionPanel({ session }: { session: CheckinSessionDto }) {
  const user = useAuthStore((s) => s.user)
  const isOrganizer = hasRole(user, 'ORGANIZER') || hasRole(user, 'SYS_ADMIN')
  const { data: records, isLoading: recordsLoading, refetch } = useCheckinRecords(session.id)
  const [toggling, setToggling] = useState(false)
  const rate = Math.round((session.signedCount / Math.max(session.totalCount, 1)) * 100)

  async function handleToggle() {
    setToggling(true)
    try {
      if (session.status === 'OPEN') {
        await closeCheckinSession(session.id)
        message.success('已关闭签到')
      } else {
        await openCheckinSession(session.id)
        message.success('已开启签到')
      }
      refetch()
    } catch {
      message.error('操作失败')
    } finally {
      setToggling(false)
    }
  }

  return (
    <Row gutter={16}>
      <Col xs={24} lg={10}>
        <Card title={`${session.title} · ${METHOD_LABEL[session.method]}`}>
          {session.method === 'CODE' && session.code && isOrganizer && (
            <Alert
              type="success" showIcon style={{ marginBottom: 12 }}
              message="签到码（仅组织者可见）"
              description={<Typography.Title level={2} style={{ margin: 0, letterSpacing: 6 }}>{session.code}</Typography.Title>}
            />
          )}
          {session.method === 'QRCODE' && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <QrcodeOutlined style={{ fontSize: 160, color: '#1677ff' }} />
            </div>
          )}
          <Space size={32} style={{ marginTop: 16 }}>
            <Statistic title="已签到" value={session.signedCount} suffix={`/ ${session.totalCount}`} />
            <Statistic title="签到率" value={rate} suffix="%" />
            <Tag color={session.status === 'OPEN' ? 'green' : 'red'}>
              {session.status === 'OPEN' ? '开放中' : session.status === 'CLOSED' ? '已关闭' : '未开启'}
            </Tag>
          </Space>
          {isOrganizer && session.status !== 'CLOSED' && (
            <Button
              type={session.status === 'OPEN' ? 'default' : 'primary'}
              danger={session.status === 'OPEN'}
              loading={toggling}
              onClick={handleToggle}
              style={{ marginTop: 12 }}
              block
            >
              {session.status === 'OPEN' ? '关闭签到' : '开启签到'}
            </Button>
          )}
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card title="签到记录">
          <Table<CheckinRecordDto>
            size="small" rowKey="id" pagination={{ pageSize: 6 }}
            dataSource={records ?? []} loading={recordsLoading}
            locale={{ emptyText: '暂无签到记录' }}
            columns={[
              { title: '姓名', dataIndex: 'realName', render: (v: string | null) => v ?? '——' },
              { title: '签到时间', dataIndex: 'checkedInAt' },
              {
                title: '状态', dataIndex: 'status',
                render: (status: string) => (
                  <span><CheckCircleTwoTone twoToneColor="#52c41a" /> {status === 'CHECKED_IN' ? '已签到' : '迟到'}</span>
                ),
              },
            ]}
          />
        </Card>
      </Col>
    </Row>
  )
}
