# 技术栈选型与约束

## 1. 技术选型

### 1.1 前端

- React + TypeScript：组件化与类型约束，适合多人协作。
- Vite：开发构建快，配置简单。
- Ant Design：后台管理与表单场景覆盖好。
- React Router：路由与权限分层实现清晰。
- Zustand：轻量全局状态（如登录态、权限）。
- TanStack React Query：服务端数据缓存与请求状态管理（列表、详情、待办等高频场景）。

### 1.2 后端

- Node.js + TypeScript + Express：轻量、可控、模块化路由易拆分。
- Prisma：数据模型驱动，迁移与类型生成统一。
- Zod：请求/响应校验与共享契约（与前端共享 schema）。
- JWT：无状态认证；后续可按需求扩展 refresh token 与 RBAC。
- Redis：缓存、限流、分布式锁（签到、防重复、待办计数等场景可用）。

### 1.3 工程化与测试

- pnpm Workspace：monorepo 管理 `frontend/ backend/ shared/`，统一依赖与脚本。
- ESLint + Prettier：代码规范与格式统一。
- Vitest：前后端单测一致体验。
- Playwright（预留）：端到端验收测试（登录→申请→审核→报名→签到→结项的关键路径）。

## 2. 版本与约束

- Node.js：>= 22
- pnpm：>= 10
- 统一使用 TypeScript（禁止在业务层引入未经约束的 `any`）
- 接口统一加版本前缀：`/api/v1/*`

