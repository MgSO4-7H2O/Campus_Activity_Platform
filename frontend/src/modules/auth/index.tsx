import { Button, Card, Form, Input, Select, Tabs, Typography, message } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { login, register } from '../../shared/api/auth'
import { getApiErrorMessage } from '../../shared/api/error'
import { useAuthStore } from '../../shared/auth/store'

type LoginForm = { username: string; password: string }
type RegisterForm = {
  username: string
  password: string
  userType: 'student' | 'teacher'
  email?: string
  phone?: string
  realName?: string
}

export default function AuthPage() {
  const navigate = useNavigate()
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const [loading, setLoading] = useState(false)

  async function onLogin(values: LoginForm) {
    setLoading(true)
    try {
      const data = await login(values)
      setAccessToken(data.accessToken)
      message.success('登录成功')
      navigate('/me')
    } catch (e: unknown) {
      message.error(getApiErrorMessage(e, '登录失败'))
    } finally {
      setLoading(false)
    }
  }

  async function onRegister(values: RegisterForm) {
    setLoading(true)
    try {
      const data = await register(values)
      setAccessToken(data.accessToken)
      message.success('注册成功')
      navigate('/me')
    } catch (e: unknown) {
      message.error(getApiErrorMessage(e, '注册失败'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card style={{ maxWidth: 520 }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        登录 / 注册
      </Typography.Title>

      <Tabs
        items={[
          {
            key: 'login',
            label: '登录',
            children: (
              <Form layout="vertical" onFinish={onLogin} initialValues={{ username: '', password: '' }}>
                <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
                  <Input autoComplete="username" />
                </Form.Item>
                <Form.Item name="password" label="密码" rules={[{ required: true }]}>
                  <Input.Password autoComplete="current-password" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  登录
                </Button>
              </Form>
            ),
          },
          {
            key: 'register',
            label: '注册',
            children: (
              <Form
                layout="vertical"
                onFinish={onRegister}
                initialValues={{ userType: 'student' as const }}
              >
                <Form.Item name="username" label="用户名" rules={[{ required: true, min: 3 }]}>
                  <Input autoComplete="username" />
                </Form.Item>
                <Form.Item name="password" label="密码" rules={[{ required: true, min: 8 }]}>
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
                <Form.Item name="userType" label="用户类型" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { value: 'student', label: '学生' },
                      { value: 'teacher', label: '教师' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="realName" label="姓名">
                  <Input />
                </Form.Item>
                <Form.Item name="email" label="邮箱">
                  <Input />
                </Form.Item>
                <Form.Item name="phone" label="手机号">
                  <Input />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  注册并登录
                </Button>
              </Form>
            ),
          },
        ]}
      />
    </Card>
  )
}
