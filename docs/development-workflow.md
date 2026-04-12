# 多人协作开发规范
## 1. 分工与模块边界

建议以“业务模块”为单位拆分任务，每个模块保持：

- 独立路由/页面入口
- 独立的 service 与测试
- 对外只暴露必要的接口（通过 `shared/` 的类型与 schema 对齐）

后端模块目录：`backend/src/modules/*`  
前端模块目录：`frontend/src/modules/*`

## 2. 分支策略（建议）

```
main        # 可演示/可验收的稳定版本
develop     # 日常集成分支
feature/*   # 个人或小组功能分支（按模块）
docs/*      # 文档分支（可选）
```

合并要求（建议）：

- 合并到 `develop` 前必须通过：`pnpm lint`、`pnpm typecheck`、`pnpm -r test:run`
- PR 描述至少包含：变更点、影响范围、测试方式

## 3. 代码组织与约束

### 3.1 后端

- 仅允许模块内互相引用；跨模块调用通过 service 层公开函数完成（避免“直接引 Prisma 模型到处用”）。
- 路由层不写业务规则；业务规则集中在 `services/`。
- 外部输入必须经过 Zod 校验（schema 可放在模块内或 `shared/`）。

### 3.2 前端

- 页面路由统一在 `frontend/src/app/router.tsx` 管理。
- 页面状态（表单、列表、弹窗）优先用组件状态；跨页面状态再用 Zustand。
- 请求统一通过 `frontend/src/shared/api/*` 管理，避免页面直接写 axios。

## 4. 统一命令（建议）

在 `campus-activity-platform/` 目录：

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm -r test:run
```

## 5. 文档与接口同步

- 新增/修改接口时，同步更新：
  - `shared/` 中的类型与 schema（如适用）
  - Swagger 注释/定义（后端）
  - `docs/api-design.md`（规则变更时）

