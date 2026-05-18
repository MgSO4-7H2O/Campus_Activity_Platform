import { ApartmentOutlined } from '@ant-design/icons'
import { Card, Empty, Space, Spin, Tag, Tree, Typography } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { useEffect, useState } from 'react'

import PageHeader from '../../shared/components/PageHeader'
import { getOrganizationTree } from '../../shared/api/organizations'
import type { OrganizationNode, OrganizationType } from '../../shared/api/dto'
import { fallbackOrgTree } from '../../shared/mock/data'

const TYPE_LABEL: Record<OrganizationType, string> = {
  club: '社团',
  student_organization: '学生组织',
  administration: '行政部门',
  department: '院系',
}

const TYPE_COLOR: Record<OrganizationType, string> = {
  club: 'blue',
  student_organization: 'cyan',
  administration: 'purple',
  department: 'geekblue',
}

function toTreeData(nodes: OrganizationNode[]): DataNode[] {
  return nodes.map((n) => ({
    key: n.id,
    title: (
      <Space size={6}>
        <Typography.Text strong>{n.name}</Typography.Text>
        <Tag color={TYPE_COLOR[n.type]}>{TYPE_LABEL[n.type]}</Tag>
        {n.status === 'DISABLED' && <Tag color="default">已停用</Tag>}
      </Space>
    ),
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }))
}

export default function OrganizationsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OrganizationNode[]>([])
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    let cancelled = false
    getOrganizationTree()
      .then((tree) => {
        if (!cancelled) setData(tree)
      })
      .catch(() => {
        if (!cancelled) {
          setData(fallbackOrgTree)
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

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="组织架构"
        subtitle="活动立项需绑定组织；审核人按组织匹配。组织树由系统管理员维护。"
      />
      <Card
        extra={
          usingFallback ? (
            <Typography.Text type="warning" style={{ fontSize: 12 }}>
              当前显示的是 Mock 数据，待后端 <code>/organizations/tree</code> 上线后将自动切换
            </Typography.Text>
          ) : null
        }
      >
        {loading ? (
          <Spin />
        ) : data.length > 0 ? (
          <Tree
            showLine
            defaultExpandAll
            selectable={false}
            treeData={toTreeData(data)}
          />
        ) : (
          <Empty
            image={<ApartmentOutlined style={{ fontSize: 48, color: '#bbb' }} />}
            description="暂无组织"
          />
        )}
      </Card>
    </Space>
  )
}
