import { Card, Typography } from 'antd'

export default function ComingSoon(props: { title: string; description?: string }) {
  return (
    <Card>
      <Typography.Title level={4}>{props.title}</Typography.Title>
      <Typography.Paragraph type="secondary">
        {props.description ?? '该模块为骨架占位，后续逐步实现。'}
      </Typography.Paragraph>
    </Card>
  )
}

