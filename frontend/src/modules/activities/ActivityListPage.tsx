import { Card, Col, Empty, Input, Row, Segmented, Space, Spin, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ActivityStatusTag } from '../../shared/components/StatusTag'
import { useActivities } from '../../shared/hooks/useActivities'
import type { ActivityDto, ActivityStatus } from '../../shared/api/dto'

type Filter = 'all' | 'RECRUITING' | 'ONGOING' | 'FINISHED'

export default function ActivityListPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [keyword, setKeyword] = useState('')

  const statusParam: ActivityStatus | undefined = filter === 'all' ? undefined : filter
  const { data, isLoading } = useActivities({ status: statusParam, keyword })

  const list = useMemo(() => {
    return (data?.items ?? []).filter((a: ActivityDto) =>
      keyword ? a.title.includes(keyword) : true,
    )
  }, [data, keyword])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>活动列表</Typography.Title>
        <Typography.Text type="secondary">浏览正在招募 / 进行中的活动并报名</Typography.Text>
      </div>
      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
            options={[
              { label: '全部', value: 'all' },
              { label: '招募中', value: 'RECRUITING' },
              { label: '进行中', value: 'ONGOING' },
              { label: '已结束', value: 'FINISHED' },
            ]}
          />
          <Input.Search placeholder="搜索活动" allowClear style={{ width: 240 }} onSearch={setKeyword} />
        </Space>

        <Spin spinning={isLoading}>
          {list.length === 0 ? (
            <Empty description="暂无活动" />
          ) : (
            <Row gutter={[16, 16]}>
              {list.map((a: ActivityDto) => (
                <Col xs={24} md={12} lg={8} key={a.id}>
                  <Card
                    hoverable
                    title={
                      <Space>
                        <ActivityStatusTag status={a.status} />
                        <Typography.Text strong>{a.title}</Typography.Text>
                      </Space>
                    }
                    extra={<Link to={`/activities/${a.id}`}>查看</Link>}
                  >
                    <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                      {a.brief}
                    </Typography.Paragraph>
                    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      🏛 {a.organizationName}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      📅 {a.startAt}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      📍 {a.location ?? '—'}
                    </Typography.Text>
                    <div style={{ marginTop: 8 }}>
                      <Tag color="blue">
                        {a.registeredCount}/{a.capacity} 人
                      </Tag>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </Card>
    </Space>
  )
}
