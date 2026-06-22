import { Alert, Button, Card, Col, Form, Input, Row, Select, Space, Spin, Table, Tag, Typography, message } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import PageHeader from '../../shared/components/PageHeader'
import { ApplicationStatusTag } from '../../shared/components/StatusTag'
import { useAuthStore } from '../../shared/auth/store'
import { useOrganizations } from '../../shared/hooks/useOrganizations'
import { createRoleApplication, listMyRoleApplications } from '../../shared/api/role-applications'
import type { CreateRoleApplicationBody, RoleApplicationDto, RoleAppliedRole } from '../../shared/api/dto'

type ApplyForm = {
  appliedRole: RoleAppliedRole
  organizationId?: string
  reason: string
}

const ROLE_OPTIONS = [
  { value: 'ORGANIZER', label: '活动负责人（ORGANIZER）', desc: '可发起活动立项、招募、签到、结项' },
  { value: 'REVIEWER', label: '审核人（REVIEWER） · 仅教师', desc: '可审核所属组织的立项 / 结项申请' },
  { value: 'SYS_ADMIN', label: '系统管理员（SYS_ADMIN）', desc: '管理用户、组织、公告' },
]

export default function PermissionApplyPage() {
  const me = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [form] = Form.useForm<ApplyForm>()
  const [appliedRole, setAppliedRole] = useState<RoleAppliedRole>()
  const [submitting, setSubmitting] = useState(false)

  const { data: orgs } = useOrganizations({ status: 'ACTIVE' })

  const {
    data: list = [],
    isLoading: listLoading,
    error: listError,
  } = useQuery({
    queryKey: ['role-applications', 'me'],
    queryFn: listMyRoleApplications,
  })

  useEffect(() => {
    if (listError) {
      message.error('加载申请记录失败')
    }
  }, [listError])

  const createMutation = useMutation({
    mutationFn: (body: CreateRoleApplicationBody) => createRoleApplication(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role-applications', 'me'] })
      form.resetFields()
      setAppliedRole(undefined)
      setSubmitting(false)
      message.success('申请已提交，等待管理员审核')
    },
    onError: () => {
      setSubmitting(false)
      message.error('提交失败，请稍后重试')
    },
  })

  const needOrg = appliedRole === 'ORGANIZER' || appliedRole === 'REVIEWER'
  const reviewerOnlyTeacher = appliedRole === 'REVIEWER' && me?.userType !== 'TEACHER'

  function onFinish(values: ApplyForm) {
    if (reviewerOnlyTeacher) {
      message.error('REVIEWER 必须是教师，请先完善用户类型')
      return
    }
    setSubmitting(true)
    createMutation.mutate({
      appliedRole: values.appliedRole,
      organizationId: values.organizationId,
      reason: values.reason,
    })
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="权限申请"
        subtitle="所有用户默认为普通用户。如需创建活动、审核或管理系统，请在此申请相应角色。"
      />

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="提交新的权限申请">
            <Alert
              showIcon
              type="info"
              style={{ marginBottom: 12 }}
              message="审核要点"
              description={
                <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                  <li>REVIEWER / ORGANIZER 必须选择所属组织</li>
                  <li>REVIEWER 角色仅教师可申请</li>
                  <li>SYS_ADMIN 由现任 SYS_ADMIN 审核</li>
                </ul>
              }
            />
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item
                name="appliedRole"
                label="申请角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select
                  placeholder="请选择角色"
                  onChange={(v: ApplyForm['appliedRole']) => setAppliedRole(v)}
                  options={ROLE_OPTIONS.map((o) => ({
                    value: o.value,
                    label: (
                      <div>
                        <Typography.Text strong>{o.label}</Typography.Text>
                        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                          {o.desc}
                        </Typography.Text>
                      </div>
                    ),
                  }))}
                />
              </Form.Item>
              {needOrg && (
                <Form.Item
                  name="organizationId"
                  label="所属组织"
                  rules={[{ required: true, message: '请选择所属组织' }]}
                >
                  <Select
                    placeholder="选择组织"
                    options={(orgs ?? []).map((o) => ({ value: o.id, label: o.name }))}
                  />
                </Form.Item>
              )}
              <Form.Item name="reason" label="申请理由" rules={[{ required: true, min: 10, message: '至少 10 个字' }]}>
                <Input.TextArea rows={4} placeholder="说明你的身份、希望承担的工作、相关经验" />
              </Form.Item>
              {reviewerOnlyTeacher && (
                <Alert type="error" showIcon message="当前账号为学生，无法申请 REVIEWER" style={{ marginBottom: 12 }} />
              )}
              <Button type="primary" htmlType="submit" loading={submitting} disabled={reviewerOnlyTeacher}>
                提交申请
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="我的权限申请">
            <Spin spinning={listLoading}>
              <Table<RoleApplicationDto>
                size="small"
                rowKey="id"
                dataSource={list}
                pagination={false}
                locale={{ emptyText: '暂无申请记录' }}
                columns={[
                  {
                    title: '申请角色',
                    dataIndex: 'appliedRole',
                    render: (v: string) => <Tag color="blue">{v}</Tag>,
                  },
                  {
                    title: '组织',
                    dataIndex: 'organizationName',
                    render: (v?: string) => v ?? '—',
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    render: (v: RoleApplicationDto['status']) => <ApplicationStatusTag status={v} />,
                  },
                  { title: '提交时间', dataIndex: 'submittedAt', render: (v: string | null) => v ?? '—' },
                ]}
              />
            </Spin>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
