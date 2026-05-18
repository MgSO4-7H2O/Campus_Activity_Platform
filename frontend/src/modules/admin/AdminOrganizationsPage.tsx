import { PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'

import PageHeader from '../../shared/components/PageHeader'
import {
  createOrganization,
  getOrganizationTree,
  updateOrganization,
} from '../../shared/api/organizations'
import { getApiErrorMessage } from '../../shared/api/error'
import type {
  CreateOrganizationBody,
  OrganizationDto,
  OrganizationNode,
  OrganizationType,
} from '../../shared/api/dto'
import { fallbackOrgTree } from '../../shared/mock/data'

const TYPE_OPTIONS: { value: OrganizationType; label: string }[] = [
  { value: 'department', label: '院系' },
  { value: 'administration', label: '行政部门' },
  { value: 'club', label: '社团' },
  { value: 'student_organization', label: '学生组织' },
]

function flatten(nodes: OrganizationNode[], depth = 0): (OrganizationDto & { depth: number })[] {
  const out: (OrganizationDto & { depth: number })[] = []
  for (const n of nodes) {
    const rest: OrganizationDto = {
      id: n.id,
      name: n.name,
      type: n.type,
      parentOrgId: n.parentOrgId,
      status: n.status,
      description: n.description,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }
    out.push({ ...rest, depth })
    if (n.children?.length) {
      out.push(...flatten(n.children, depth + 1))
    }
  }
  return out
}

export default function AdminOrganizationsPage() {
  const [tree, setTree] = useState<OrganizationNode[]>([])
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<OrganizationDto | null>(null)
  const [form] = Form.useForm<CreateOrganizationBody & { id?: string }>()

  async function reload() {
    setLoading(true)
    try {
      const t = await getOrganizationTree()
      setTree(t)
      setUsingFallback(false)
    } catch {
      setTree(fallbackOrgTree)
      setUsingFallback(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const flat = useMemo(() => flatten(tree), [tree])

  function openCreate() {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  function openEdit(org: OrganizationDto) {
    setEditing(org)
    form.setFieldsValue({
      name: org.name,
      type: org.type,
      parentOrgId: org.parentOrgId ?? undefined,
      description: org.description ?? undefined,
    })
    setModalOpen(true)
  }

  async function onSubmit() {
    const values = await form.validateFields()
    try {
      if (usingFallback) {
        message.warning('当前为 Mock 模式，提交未真实生效；后端就绪后将打通。')
        setModalOpen(false)
        return
      }
      if (editing) {
        await updateOrganization(editing.id, values)
        message.success('已更新组织')
      } else {
        await createOrganization(values)
        message.success('已新增组织')
      }
      setModalOpen(false)
      reload()
    } catch (err) {
      message.error(getApiErrorMessage(err, '保存失败'))
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="组织管理"
        subtitle="维护组织树。活动立项的动态审核规则依赖 type 与 parent_org_id。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增组织
          </Button>
        }
      />
      <Card>
        {usingFallback && (
          <Typography.Text type="warning" style={{ fontSize: 12 }}>
            当前为 Mock 数据。后端 <code>/admin/organizations</code> 接口上线后此页面将打通。
          </Typography.Text>
        )}
        <Table
          rowKey="id"
          loading={loading}
          dataSource={flat}
          pagination={false}
          columns={[
            {
              title: '名称',
              dataIndex: 'name',
              render: (v: string, r) => (
                <span style={{ paddingLeft: r.depth * 24 }}>
                  {r.depth > 0 ? '└─ ' : ''}
                  {v}
                </span>
              ),
            },
            {
              title: '类型',
              dataIndex: 'type',
              render: (v: OrganizationType) => (
                <Tag>{TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v}</Tag>
              ),
            },
            {
              title: '状态',
              dataIndex: 'status',
              render: (v: string) =>
                v === 'ACTIVE' ? <Tag color="green">启用</Tag> : <Tag>停用</Tag>,
            },
            {
              title: '操作',
              key: 'action',
              width: 140,
              render: (_, r) => (
                <Space size={4}>
                  <Button type="link" size="small" onClick={() => openEdit(r)}>
                    编辑
                  </Button>
                  {r.status === 'ACTIVE' ? (
                    <Button
                      type="link"
                      size="small"
                      danger
                      onClick={async () => {
                        if (usingFallback) {
                          message.warning('Mock 模式，未真实生效')
                          return
                        }
                        await updateOrganization(r.id, { status: 'DISABLED' })
                        reload()
                      }}
                    >
                      停用
                    </Button>
                  ) : (
                    <Button
                      type="link"
                      size="small"
                      onClick={async () => {
                        if (usingFallback) {
                          message.warning('Mock 模式，未真实生效')
                          return
                        }
                        await updateOrganization(r.id, { status: 'ACTIVE' })
                        reload()
                      }}
                    >
                      启用
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editing ? '编辑组织' : '新增组织'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={onSubmit}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="组织名称" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="parentOrgId" label="上级组织">
            <Select
              allowClear
              options={flat.map((o) => ({ value: o.id, label: o.name }))}
            />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
