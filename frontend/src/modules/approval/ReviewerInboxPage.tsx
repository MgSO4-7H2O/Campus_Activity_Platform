import { ClockCircleOutlined } from '@ant-design/icons'
import { Badge, Button, Card, Empty, Input, Space, Spin, Table, Typography, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { listMyPendingTasks } from '../../shared/api/pending-tasks'
import { getApiErrorMessage } from '../../shared/api/error'
import type { PendingTaskDto } from '../../shared/api/dto'

export default function ReviewerInboxPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<PendingTaskDto[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listMyPendingTasks({ status: 'PENDING' })
      setTasks(data.filter((t) => t.relatedResourceType === 'ACTIVITY_APPLICATION'))
    } catch (err) {
      message.error(getApiErrorMessage(err, '加载审核待办失败'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const data = useMemo(
    () =>
      tasks.filter((t) =>
        keyword ? t.title.includes(keyword) || (t.description ?? '').includes(keyword) : true
      ),
    [tasks, keyword]
  )

  function goReview(applicationId: string) {
    navigate(`/approvals/${applicationId}`)
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={
          <Space>
            立项审核待办
            <Badge count={tasks.length} />
          </Space>
        }
        subtitle="按提交时间排序，点击进入审核详情"
      />

      <Card>
        <Space style={{ marginBottom: 12 }}>
          <Input.Search
            placeholder="搜索活动名称 / 说明"
            style={{ width: 280 }}
            onSearch={setKeyword}
            allowClear
          />
          <Button onClick={load}>刷新</Button>
        </Space>

        {loading ? (
          <Spin />
        ) : (
          <Table
            size="middle"
            rowKey="id"
            dataSource={data}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无待审核的立项申请" /> }}
            columns={[
              {
                title: '活动名称',
                dataIndex: 'title',
                render: (v: string, row) => (
                  <Typography.Link onClick={() => goReview(row.relatedResourceId)}>{v}</Typography.Link>
                ),
              },
              { title: '说明', dataIndex: 'description', render: (v: string | null) => v ?? '—' },
              {
                title: '提交时间',
                dataIndex: 'createdAt',
                width: 200,
                render: (v: string) => (
                  <Space size={4}>
                    <ClockCircleOutlined />
                    {new Date(v).toLocaleString('zh-CN')}
                  </Space>
                ),
              },
              {
                title: '操作',
                key: 'action',
                width: 110,
                render: (_, row) => (
                  <Button type="primary" size="small" onClick={() => goReview(row.relatedResourceId)}>
                    立即审核
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>
    </Space>
  )
}
