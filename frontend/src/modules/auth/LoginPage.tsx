import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Form, Input, Space, Typography, message } from 'antd'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { login } from '../../shared/api/auth'
import { getMe } from '../../shared/api/users'
import { getApiErrorMessage } from '../../shared/api/error'
import { useAuthStore } from '../../shared/auth/store'

type LoginForm = { username: string; password: string }
type LocationState = { from?: { pathname?: string } } | null

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const from = (location.state as LocationState)?.from?.pathname ?? '/me'

  async function onFinish(values: LoginForm) {
    setLoading(true)
    try {
      const data = await login(values)
      setSession(data.accessToken, data.user)
      // 拉一次完整 profile 写回 store，便于个人信息页直接展示。
      try {
        const fullUser = await getMe()
        setUser(fullUser)
      } catch {
        /* ignore */
      }
      message.success('登录成功')
      navigate(from, { replace: true })
    } catch (e) {
      message.error(getApiErrorMessage(e, '登录失败'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 32 }}>
      <Card style={{ width: 420 }}>
        <Typography.Title level={3} style={{ margin: 0, marginBottom: 4 }}>
          欢迎登录
        </Typography.Title>
        <Typography.Text type="secondary">使用学号/工号或自定义用户名登录</Typography.Text>

        <Alert
          showIcon
          type="info"
          style={{ margin: '16px 0' }}
          message="演示账号"
          description={
            <Space direction="vertical" size={2}>
              <span>student1 / Password123! · 学生</span>
              <span>organizer1 / Password123! · 学生 + 活动负责人</span>
              <span>reviewer1 / Password123! · 教师 + 审核人</span>
              <span>admin / Password123! · 系统管理员</span>
            </Space>
          }
        />

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} autoComplete="username" placeholder="如 student1" size="large" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password
              prefix={<LockOutlined />}
              autoComplete="current-password"
              placeholder="至少 8 位"
              size="large"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            登录
          </Button>
        </Form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Typography.Text type="secondary">还没有账号？</Typography.Text>
          <Link to="/register" style={{ marginLeft: 8 }}>
            立即注册
          </Link>
        </div>
      </Card>
    </div>
  )
}
