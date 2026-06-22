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
import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import PageHeader from '../../shared/components/PageHeader'
import {
  createOrganization,
  updateOrganization,
} from '../../shared/api/organizations'
import { getApiErrorMessage } from '../../shared/api/error'
import { useOrgTree, orgKeys } from '../../shared/hooks/useOrganizations'
import type {
  CreateOrganizationBody,
  OrganizationDto,
  OrganizationNode,
  OrganizationType,
} from '../../shared/api/dto'

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
  const queryClient = useQueryClient()
  const { data: tree, isLoading, error } = useOrgTree()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<OrganizationDto | null>(null)
  const [form] = Form.useForm<CreateOrganizationBody & { id?: string }>()

  const flat = useMemo(() => flatten(tree ?? []), [tree])

  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      message.success('已新增组织')
      queryClient.invalidateQueries({ queryKey: orgKeys.tree })
      setModalOpen(false)
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, '保存失败'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateOrganization>[1] }) =>
      updateOrganization(id, body),
    onSuccess: () => {
      message.success('已更新组织')
      queryClient.invalidateQueries({ queryKey: orgKeys.tree })
      setModalOpen(false)
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, '保存失败'))
    },
  })

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
    if (editing) {
      updateMutation.mutate({ id: editing.id, body: values })
    } else {
      createMutation.mutate(values)
    }
  }

  function handleToggleStatus(org: OrganizationDto, newStatus: 'ACTIVE' | 'DISABLED') {
    updateMutation.mutate({ id: org.id, body: { status: newStatus } })
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
        {error && (
          <Typography.Text type="danger" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            加载失败：{getApiErrorMessage(error, '未知错误')}
          </Typography.Text>
        )}
        <Table
          rowKey="id"
          loading={isLoading}
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
                      onClick={() => handleToggleStatus(r, 'DISABLED')}
                    >
                      停用
                    </Button>
                  ) : (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => handleToggleStatus(r, 'ACTIVE')}
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
        confirmLoading={createMutation.isPending || updateMutation.isPending}
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
