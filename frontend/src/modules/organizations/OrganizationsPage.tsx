import { ApartmentOutlined } from '@ant-design/icons'
import { Card, Empty, Space, Spin, Tag, Tree, Typography, message } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { useEffect } from 'react'

import PageHeader from '../../shared/components/PageHeader'
import { useOrgTree } from '../../shared/hooks/useOrganizations'
import type { OrganizationNode, OrganizationType } from '../../shared/api/dto'

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
  const { data, isLoading, error } = useOrgTree()

  useEffect(() => {
    if (error) {
      message.error('加载组织架构失败')
    }
  }, [error])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="组织架构"
        subtitle="活动立项需绑定组织；审核人按组织匹配。组织树由系统管理员维护。"
      />
      <Card>
        {isLoading ? (
          <Spin />
        ) : data && data.length > 0 ? (
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
