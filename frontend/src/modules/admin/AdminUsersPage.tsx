import { Card, Input, Popconfirm, Space, Switch, Table, Tag, Typography, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { listAdminUsers, setAdminUserStatus } from '../../shared/api/admin'
import { getApiErrorMessage } from '../../shared/api/error'
import type { AdminUserDto } from '../../shared/api/dto'
import { fallbackAdminUsers } from '../../shared/mock/data'
import { ROLE_LABELS } from '../../shared/auth/store'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listAdminUsers({ pageSize: 100 })
      .then((p) => {
        if (!cancelled) setUsers(p.items)
      })
      .catch(() => {
        if (!cancelled) {
          setUsers(fallbackAdminUsers)
          setUsingFallback(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase()
    if (!k) return users
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(k) ||
        (u.realName ?? '').toLowerCase().includes(k) ||
        (u.email ?? '').toLowerCase().includes(k)
    )
  }, [users, keyword])

  async function onToggleStatus(u: AdminUserDto, next: boolean) {
    const targetStatus = next ? 'ACTIVE' : 'DISABLED'
    try {
      if (!usingFallback) {
        await setAdminUserStatus(u.id, { status: targetStatus })
      }
      setUsers((curr) =>
        curr.map((x) => (x.id === u.id ? { ...x, status: targetStatus } : x))
      )
      message.success(`已${next ? '启用' : '停用'} ${u.username}`)
    } catch (err) {
      message.error(getApiErrorMessage(err, '操作失败'))
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="用户管理"
        subtitle="查看用户、角色、组织绑定与启用状态。停用用户后将无法登录。"
        extra={
          <Input.Search
            allowClear
            placeholder="按用户名/姓名/邮箱搜索"
            style={{ width: 280 }}
            onSearch={setKeyword}
            onChange={(e) => !e.target.value && setKeyword('')}
          />
        }
      />
      <Card>
        {usingFallback && (
          <Typography.Text type="warning" style={{ fontSize: 12 }}>
            当前为 Mock 数据，待后端 <code>/admin/users</code> 上线后自动切换
          </Typography.Text>
        )}
        <Table<AdminUserDto>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: '用户名',
              dataIndex: 'username',
              render: (v: string, r) => <Link to={`/admin/users/${r.id}`}>{v}</Link>,
            },
            { title: '姓名', dataIndex: 'realName', render: (v) => v ?? '-' },
            {
              title: '身份',
              dataIndex: 'userType',
              render: (v: string) => (v === 'STUDENT' ? '学生' : '教师'),
            },
            {
              title: '角色',
              dataIndex: 'roles',
              render: (roles: string[]) => (
                <Space wrap size={4}>
                  {roles.map((r) => (
                    <Tag key={r} color={r === 'SYS_ADMIN' ? 'red' : r === 'REVIEWER' ? 'gold' : r === 'ORGANIZER' ? 'blue' : 'default'}>
                      {ROLE_LABELS[r] ?? r}
                    </Tag>
                  ))}
                </Space>
              ),
            },
            {
              title: '组织',
              dataIndex: 'organizations',
              render: (orgs: AdminUserDto['organizations']) =>
                orgs.length ? orgs.map((o) => o.name).join('、') : '-',
            },
            {
              title: '启用',
              dataIndex: 'status',
              width: 120,
              render: (v: string, r) => (
                <Popconfirm
                  title={`确定要${v === 'ACTIVE' ? '停用' : '启用'} ${r.username} 吗？`}
                  onConfirm={() => onToggleStatus(r, v !== 'ACTIVE')}
                >
                  <Switch checked={v === 'ACTIVE'} />
                </Popconfirm>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}
