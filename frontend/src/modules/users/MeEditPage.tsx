import { Button, Card, Form, Input, Skeleton, Space, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '../../shared/api/error'
import type { UserDto } from '../../shared/api/types'
import { getMe, updateMe } from '../../shared/api/users'
import { useAuthStore } from '../../shared/auth/store'
import PageHeader from '../../shared/components/PageHeader'

type FormValue = { realName?: string; phone?: string; email?: string }

export default function MeEditPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [me, setMe] = useState<UserDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<FormValue>()

  useEffect(() => {
    getMe()
      .then((data) => {
        setMe(data)
        form.setFieldsValue({
          realName: data.realName ?? undefined,
          phone: data.phone ?? undefined,
          email: data.email ?? undefined,
        })
      })
      .catch((e) => message.error(getApiErrorMessage(e, '加载失败')))
  }, [form])

  async function onFinish(values: FormValue) {
    setSubmitting(true)
    try {
      const updated = await updateMe(values)
      setUser(updated)
      message.success('已保存')
      navigate('/me')
    } catch (e) {
      message.error(getApiErrorMessage(e, '保存失败'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="编辑基础信息" subtitle="修改姓名、邮箱、手机号" />
      <Card>
        {me ? (
          <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 480 }}>
            <Form.Item name="realName" label="真实姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="手机号">
              <Input />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                保存
              </Button>
              <Button onClick={() => navigate('/me')}>取消</Button>
            </Space>
          </Form>
        ) : (
          <Skeleton active />
        )}
      </Card>
    </Space>
  )
}
