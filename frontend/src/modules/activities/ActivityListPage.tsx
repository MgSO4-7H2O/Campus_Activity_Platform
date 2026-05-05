import { Card, Col, Empty, Input, Row, Segmented, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import PageHeader from '../../shared/components/PageHeader'
import { ActivityStatusTag } from '../../shared/components/StatusTag'
import { activities, type ActivityStatus } from '../../shared/mock/data'

type Filter = 'all' | 'recruiting' | 'ongoing' | 'finished'

export default function ActivityListPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [keyword, setKeyword] = useState('')

  const list = useMemo(() => {
    return activities
      .filter((a) => (filter === 'all' ? true : a.status === filter))
      .filter((a) => (keyword ? a.title.includes(keyword) : true))
  }, [filter, keyword])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="活动列表" subtitle="浏览正在招募 / 进行中的活动并报名" />
      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
            options={[
              { label: '全部', value: 'all' },
              { label: '招募中', value: 'recruiting' },
              { label: '进行中', value: 'ongoing' },
              { label: '已结束', value: 'finished' },
            ]}
          />
          <Input.Search placeholder="搜索活动" allowClear style={{ width: 240 }} onSearch={setKeyword} />
        </Space>

        {list.length === 0 ? (
          <Empty description="暂无活动" />
        ) : (
          <Row gutter={[16, 16]}>
            {list.map((a) => (
              <Col xs={24} md={12} lg={8} key={a.id}>
                <Card
                  hoverable
                  title={
                    <Space>
                      <ActivityStatusTag status={a.status as ActivityStatus} />
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
                    📍 {a.location}
                  </Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color="blue">
                      {a.registered}/{a.capacity} 人
                    </Tag>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </Space>
  )
}
