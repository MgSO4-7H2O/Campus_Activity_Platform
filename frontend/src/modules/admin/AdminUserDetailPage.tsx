import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Card, Col, Descriptions, Empty, Row, Space, Spin, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { getAdminUser } from '../../shared/api/admin'
import type { AdminUserDto } from '../../shared/api/dto'
import { fallbackAdminUsers } from '../../shared/mock/data'
import { ROLE_LABELS } from '../../shared/auth/store'

export default function AdminUserDetailPage() {
  const { id = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AdminUserDto | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAdminUser(id)
      .then((d) => !cancelled && setData(d))
      .catch(() => {
        const fb = fallbackAdminUsers.find((u) => u.id === id) ?? null
        if (!cancelled) setData(fb)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <Spin />
  if (!data) return <Empty description="未找到该用户" />

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={`用户：${data.realName ?? data.username}`}
        subtitle={`@${data.username}`}
        extra={
          <Link to="/admin/users">
            <Button icon={<ArrowLeftOutlined />}>返回</Button>
          </Link>
        }
      />
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="基础信息">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="用户 ID">{data.id}</Descriptions.Item>
              <Descriptions.Item label="账号状态">
                <Tag color={data.status === 'ACTIVE' ? 'green' : 'default'}>
                  {data.status === 'ACTIVE' ? '正常' : '已停用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="身份">
                {data.userType === 'STUDENT' ? '学生' : '教师'}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">{data.email ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="手机">{data.phone ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {new Date(data.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="角色">
            <Space wrap>
              {data.roles.map((r) => (
                <Tag key={r} color={r === 'SYS_ADMIN' ? 'red' : 'blue'}>
                  {ROLE_LABELS[r] ?? r}
                </Tag>
              ))}
            </Space>
          </Card>
          <Card title="所属组织" style={{ marginTop: 16 }}>
            {data.organizations.length === 0 ? (
              <Typography.Text type="secondary">该用户暂未绑定任何组织</Typography.Text>
            ) : (
              <Space direction="vertical" size={4}>
                {data.organizations.map((o) => (
                  <Tag key={o.id}>{o.name}</Tag>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
