import { EditOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, Descriptions, Empty, Row, Skeleton, Space, Tag, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../../shared/api/error'
import type { UserDto } from '../../shared/api/types'
import { getMe } from '../../shared/api/users'
import { ROLE_LABELS, useAuthStore } from '../../shared/auth/store'
import PageHeader from '../../shared/components/PageHeader'

const ROLE_TAG_COLOR: Record<string, string> = {
  BASIC_USER: 'default',
  ORGANIZER: 'blue',
  REVIEWER: 'purple',
  SYS_ADMIN: 'magenta',
}

export default function MePage() {
  const setUser = useAuthStore((s) => s.setUser)
  const [loading, setLoading] = useState(false)
  const [me, setMe] = useState<UserDto | null>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await getMe()
      setMe(data)
      setUser(data)
    } catch (e) {
      message.error(getApiErrorMessage(e, '加载失败'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="个人信息"
        subtitle="登录后查看与维护你的账号资料"
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              刷新
            </Button>
            <Link to="/me/edit">
              <Button icon={<EditOutlined />}>编辑基础信息</Button>
            </Link>
            <Link to="/me/profile">
              <Button type="primary" icon={<EditOutlined />}>
                编辑扩展资料
              </Button>
            </Link>
          </>
        }
      />

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title="账号资料">
            {loading && !me ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : me ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="用户名">{me.username}</Descriptions.Item>
                <Descriptions.Item label="姓名">{me.realName ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="用户类型">
                  {me.userType === 'STUDENT' ? '学生' : '教师'}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">{me.email ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="手机号">{me.phone ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="角色">
                  {me.roles.length ? (
                    me.roles.map((r) => (
                      <Tag key={r} color={ROLE_TAG_COLOR[r]}>
                        {ROLE_LABELS[r] ?? r}
                      </Tag>
                    ))
                  ) : (
                    <Typography.Text type="secondary">-</Typography.Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="账号状态">
                  <Tag color={me.status === 'ACTIVE' ? 'green' : 'red'}>{me.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="注册时间">{me.createdAt}</Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty />
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={me?.userType === 'TEACHER' ? '教师扩展资料' : '学生扩展资料'}>
            {loading && !me ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : me?.userType === 'STUDENT' ? (
              me.studentProfile ? (
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="学院">{me.studentProfile.college ?? '-'}</Descriptions.Item>
                  <Descriptions.Item label="专业">{me.studentProfile.major ?? '-'}</Descriptions.Item>
                  <Descriptions.Item label="年级">{me.studentProfile.grade ?? '-'}</Descriptions.Item>
                  <Descriptions.Item label="班级">{me.studentProfile.className ?? '-'}</Descriptions.Item>
                </Descriptions>
              ) : (
                <Empty description="尚未填写" />
              )
            ) : me?.teacherProfile ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="部门">{me.teacherProfile.departmentName ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="职称">{me.teacherProfile.jobTitle ?? '-'}</Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty description="尚未填写" />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
