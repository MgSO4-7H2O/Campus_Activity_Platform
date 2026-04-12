# 架构设计（骨架版）

## 1. 总体架构

采用“前端 SPA + 后端 REST API + 共享契约包”的三段式架构：

- `frontend/`：页面与交互（不直接依赖后端实现细节）
- `backend/`：业务 API 与流程编排（按模块拆分）
- `shared/`：共享类型、枚举、校验 schema、错误码等（避免前后端口径不一致）

## 2. 后端模块划分（对应需求 10 模块）

后端按业务域拆分，每个模块具备独立路由与单测入口，避免“巨型 controller/service”。

基本模块（后续可调整）：

1. `auth`：登录、角色识别、权限校验
2. `announcements`：新闻/通知发布与查询
3. `activity-applications`：活动申请、材料提交、状态查询
4. `approval`：组织号→审核链匹配、流转、待办
5. `recruitment`：招募发布、报名、报名审核
6. `checkin`：签到码/二维码生成、签到记录、防重复
7. `closure`：结项材料、归档、结果查询
8. `notifications`：站内消息、推送通道适配（预留）
9. `orgs`：组织/组织号管理
10. `admin`：系统管理（审核链配置、异常匹配处理等）

## 3. 分层建议

- `routes`：只做路由声明、参数提取与调用服务
- `services`：业务规则与流程编排（核心）
- `repositories`：数据访问（Prisma）
- `schemas`：Zod 校验（可与 shared 共享）
- `tests`：模块单测（路由/服务）

## 4. 接口与错误规范（建议）

- 统一响应：
  - 成功：`{ data, meta? }`
  - 失败：`{ error: { code, message, details? } }`
- 统一分页：`page/pageSize/total`
- 统一鉴权：`Authorization: Bearer <token>`

详细见：`docs/api-design.md`。

