import { Button, Card, Form, Input, InputNumber, Skeleton, Space, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '../../shared/api/error'
import type { UserDto } from '../../shared/api/types'
import { getMe, updateMyProfile } from '../../shared/api/users'
import { useAuthStore } from '../../shared/auth/store'
import PageHeader from '../../shared/components/PageHeader'

type StudentForm = { college?: string; major?: string; grade?: number; className?: string }
type TeacherForm = { departmentName?: string; jobTitle?: string }

export default function MeProfilePage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [me, setMe] = useState<UserDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<StudentForm | TeacherForm>()

  useEffect(() => {
    getMe()
      .then((data) => {
        setMe(data)
        if (data.userType === 'STUDENT') {
          form.setFieldsValue({
            college: data.studentProfile?.college ?? undefined,
            major: data.studentProfile?.major ?? undefined,
            grade: data.studentProfile?.grade ? Number(data.studentProfile.grade) : undefined,
            className: data.studentProfile?.className ?? undefined,
          })
        } else {
          form.setFieldsValue({
            departmentName: data.teacherProfile?.departmentName ?? undefined,
            jobTitle: data.teacherProfile?.jobTitle ?? undefined,
          })
        }
      })
      .catch((e) => message.error(getApiErrorMessage(e, '加载失败')))
  }, [form])

  async function onFinish(values: StudentForm | TeacherForm) {
    setSubmitting(true)
    try {
      const updated = await updateMyProfile(values as Record<string, unknown>)
      setUser(updated)
      message.success('已保存')
      navigate('/me')
    } catch (e) {
      message.error(getApiErrorMessage(e, '保存失败'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!me) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <PageHeader title="编辑扩展资料" />
        <Card>
          <Skeleton active />
        </Card>
      </Space>
    )
  }

  const isStudent = me.userType === 'STUDENT'

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="编辑扩展资料"
        subtitle={isStudent ? '完善学院 / 专业 / 年级 / 班级，便于活动按专业、年级筛选报名' : '完善部门 / 职称'}
      />
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 480 }}>
          {isStudent ? (
            <>
              <Form.Item name="college" label="学院">
                <Input placeholder="如 计算机科学与技术学院" />
              </Form.Item>
              <Form.Item name="major" label="专业">
                <Input placeholder="如 软件工程" />
              </Form.Item>
              <Form.Item name="grade" label="年级">
                <InputNumber placeholder="如 2024" style={{ width: '100%' }} min={1900} max={2100} />
              </Form.Item>
              <Form.Item name="className" label="班级">
                <Input placeholder="如 软工2401" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item name="departmentName" label="部门">
                <Input />
              </Form.Item>
              <Form.Item name="jobTitle" label="职称">
                <Input />
              </Form.Item>
            </>
          )}
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            扩展资料用于报名校验，可随时回到此页修改。
          </Typography.Text>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              保存
            </Button>
            <Button onClick={() => navigate('/me')}>取消</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  )
}
