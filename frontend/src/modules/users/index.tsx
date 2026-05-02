import { Button, Card, Descriptions, Divider, Form, Input, Space, Tag, Typography, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getMe, updateMe, updateMyProfile } from '../../shared/api/users'
import { getApiErrorMessage } from '../../shared/api/error'
import type { UserDto } from '../../shared/api/types'
import { useAuthStore } from '../../shared/auth/store'

export default function MePage() {
  const token = useAuthStore((s) => s.accessToken)
  const logout = useAuthStore((s) => s.logout)
  const [loading, setLoading] = useState(false)
  const [me, setMe] = useState<UserDto | null>(null)

  const profileTypeLabel = useMemo(() => {
    if (!me) return ''
    return me.userType === 'STUDENT' ? '学生资料' : '教师资料'
  }, [me])

  async function loadMe() {
    setLoading(true)
    try {
      const data = await getMe()
      setMe(data)
    } catch (e: unknown) {
      message.error(getApiErrorMessage(e, '加载失败'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    loadMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (!token) {
    return (
      <Card>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          未登录
        </Typography.Title>
        <Typography.Paragraph>
          请先前往 <Link to="/auth">登录/注册</Link>
        </Typography.Paragraph>
      </Card>
    )
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card
        title="当前用户"
        extra={
          <Space>
            <Button onClick={loadMe} loading={loading}>
              刷新
            </Button>
            <Button
              danger
              onClick={() => {
                logout()
                setMe(null)
              }}
            >
              退出登录
            </Button>
          </Space>
        }
      >
        {me ? (
          <>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="ID">{me.id}</Descriptions.Item>
              <Descriptions.Item label="用户名">{me.username}</Descriptions.Item>
              <Descriptions.Item label="用户类型">{me.userType}</Descriptions.Item>
              <Descriptions.Item label="状态">{me.status}</Descriptions.Item>
              <Descriptions.Item label="姓名">{me.realName ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{me.email ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="手机号">{me.phone ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="角色">
                {me.roles.length ? me.roles.map((r) => <Tag key={r}>{r}</Tag>) : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Typography.Title level={5} style={{ marginTop: 0 }}>
              修改基础信息
            </Typography.Title>
            <Form
              layout="vertical"
              initialValues={{
                realName: me.realName ?? undefined,
                email: me.email ?? undefined,
                phone: me.phone ?? undefined,
              }}
              onFinish={async (values) => {
                try {
                  const updated = await updateMe(values)
                  setMe(updated)
                  message.success('已更新')
                } catch (e: unknown) {
                  message.error(getApiErrorMessage(e, '更新失败'))
                }
              }}
            >
              <Form.Item name="realName" label="姓名">
                <Input />
              </Form.Item>
              <Form.Item name="email" label="邮箱">
                <Input />
              </Form.Item>
              <Form.Item name="phone" label="手机号">
                <Input />
              </Form.Item>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Form>

            <Divider />

            <Typography.Title level={5} style={{ marginTop: 0 }}>
              {profileTypeLabel}
            </Typography.Title>

            {me.userType === 'STUDENT' ? (
              <Form
                layout="vertical"
                initialValues={{
                  college: me.studentProfile?.college ?? undefined,
                  major: me.studentProfile?.major ?? undefined,
                  grade: me.studentProfile?.grade ?? undefined,
                  className: me.studentProfile?.className ?? undefined,
                }}
                onFinish={async (values) => {
                  try {
                    const updated = await updateMyProfile(values)
                    setMe(updated)
                    message.success('已更新')
                  } catch (e: unknown) {
                    message.error(getApiErrorMessage(e, '更新失败'))
                  }
                }}
              >
                <Form.Item name="college" label="学院">
                  <Input />
                </Form.Item>
                <Form.Item name="major" label="专业">
                  <Input />
                </Form.Item>
                <Form.Item name="grade" label="年级">
                  <Input />
                </Form.Item>
                <Form.Item name="className" label="班级">
                  <Input />
                </Form.Item>
                <Button type="primary" htmlType="submit">
                  保存
                </Button>
              </Form>
            ) : (
              <Form
                layout="vertical"
                initialValues={{
                  departmentName: me.teacherProfile?.departmentName ?? undefined,
                  jobTitle: me.teacherProfile?.jobTitle ?? undefined,
                }}
                onFinish={async (values) => {
                  try {
                    const updated = await updateMyProfile(values)
                    setMe(updated)
                    message.success('已更新')
                  } catch (e: unknown) {
                    message.error(getApiErrorMessage(e, '更新失败'))
                  }
                }}
              >
                <Form.Item name="departmentName" label="部门">
                  <Input />
                </Form.Item>
                <Form.Item name="jobTitle" label="职称">
                  <Input />
                </Form.Item>
                <Button type="primary" htmlType="submit">
                  保存
                </Button>
              </Form>
            )}
          </>
        ) : (
          <Typography.Paragraph type="secondary">加载中…</Typography.Paragraph>
        )}
      </Card>
    </Space>
  )
}
