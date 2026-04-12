# 数据库设计（骨架版，可迭代）

> 本文给出“数据实体 + 关键关系 + 状态枚举”的起始版本，便于后续按模块逐步细化。

## 1. 实体清单

1. 用户（User）
2. 组织（Organization）
3. 审核链（ApprovalChain / ApprovalChainNode）
4. 活动申请（ActivityApplication）
5. 申请材料（ApplicationAttachment）
6. 审核记录（ApprovalRecord）
7. 招募（Recruitment）
8. 报名（Signup）
9. 签到（CheckinRecord）
10. 新闻/通知（Announcement）
11. 站内消息（Notification，预留）

## 2. 关键关系（建议）

- Organization 1 - N ApprovalChain（或 1 - 1，视业务而定）
- ActivityApplication N - 1 Organization
- ActivityApplication 1 - N ApplicationAttachment
- ActivityApplication 1 - N ApprovalRecord（流转留痕）
- Recruitment N - 1 ActivityApplication（一个活动可多次招募：可选）
- Signup N - 1 Recruitment
- CheckinRecord N - 1 ActivityApplication / Recruitment（按你们业务选择）

## 3. 状态枚举（建议）

- ActivityApplicationStatus：DRAFT / SUBMITTED / APPROVING / REJECTED / NEED_MORE / APPROVED / ARCHIVED
- SignupStatus：PENDING / APPROVED / REJECTED / CANCELED
- CheckinStatus：CHECKED_IN / ABSENT / LATE / LEFT_EARLY

## 4. Prisma 落地

数据库模型在：`backend/prisma/schema.prisma`（当前为骨架，可随模块实现逐步补全）。

