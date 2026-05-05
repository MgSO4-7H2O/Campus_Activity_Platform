import { Button, Card, Form, Input, Radio, Typography, message } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { register } from '../../shared/api/auth'
import { getMe } from '../../shared/api/users'
import { getApiErrorMessage } from '../../shared/api/error'
import { useAuthStore } from '../../shared/auth/store'

type RegisterForm = {
  username: string
  password: string
  realName: string
  userType: 'student' | 'teacher'
  email?: string
  phone?: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setSession, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)

  async function onFinish(values: RegisterForm) {
    setLoading(true)
    try {
      const data = await register(values)
      setSession(data.accessToken, data.user)
      try {
        const fullUser = await getMe()
        setUser(fullUser)
      } catch {
        /* ignore */
      }
      message.success('注册成功，已自动登录')
      navigate('/me/profile', { replace: true })
    } catch (e) {
      message.error(getApiErrorMessage(e, '注册失败'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
      <Card style={{ width: 480 }}>
        <Typography.Title level={3} style={{ margin: 0, marginBottom: 4 }}>
          注册新账号
        </Typography.Title>
        <Typography.Text type="secondary">默认获得普通用户权限，登录后可申请活动负责人 / 审核人 / 管理员</Typography.Text>

        <Form layout="vertical" onFinish={onFinish} initialValues={{ userType: 'student' }} style={{ marginTop: 16 }}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 32, message: '长度 3–32 位' },
            ]}
            extra="3–32 位，登录时使用"
          >
            <Input autoComplete="username" placeholder="如 zhangsan2024" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '至少 8 位' },
            ]}
          >
            <Input.Password autoComplete="new-password" placeholder="至少 8 位" />
          </Form.Item>
          <Form.Item name="realName" label="真实姓名" rules={[{ required: true, message: '请输入真实姓名' }]}>
            <Input placeholder="将用于报名签到核验" />
          </Form.Item>
          <Form.Item name="userType" label="用户类型" rules={[{ required: true }]}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={[
                { value: 'student', label: '学生' },
                { value: 'teacher', label: '教师' },
              ]}
            />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="可选" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            注册并登录
          </Button>
        </Form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Typography.Text type="secondary">已有账号？</Typography.Text>
          <Link to="/login" style={{ marginLeft: 8 }}>
            返回登录
          </Link>
        </div>
      </Card>
    </div>
  )
}
