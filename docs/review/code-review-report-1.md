# 代码审查报告

> 审查日期：2026-05-08  
> 审查人：需求设计与代码审查负责人  
> 审查范围：全项目（后端、前端、shared、测试、数据库）

---

## 一、审查概要

本次审查对照以下设计文档逐项检查：

| 参考文档 | 用途 |
|---|---|
| `docs/requirements.md` | 功能需求与业务流程 |
| `docs/architecture.md` | 模块划分与分层架构 |
| `docs/api-design.md` | 接口规范与响应格式 |
| `docs/development-workflow.md` | 分支策略、代码组织、合并规范 |
| `docs/testing.md` | 测试分层与最小用例要求 |
| `docs/tech-stack.md` | 技术栈约束 |

**总体评价**：项目骨架搭建规范，基础模块（auth / users）实现质量较高，分层清晰。但 **6 个核心业务模块尚未实现**，测试覆盖率严重不足，前后端存在多处状态值与类型不一致，shared 包未被充分利用。当前状态适合作为原型演示，距离完整可交付系统还有较大差距。

---

## 二、模块实现完成度

对照 `architecture.md` 规划的 10 个后端模块：

| 序号 | 模块 | 路由 | Service | Repository | Schema | 测试 | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | auth | ✅ | ✅ | ✅ | ✅ | ✅ (4 cases) | **已完成** |
| 2 | users | ✅ | ✅ | ✅ | ✅ | ❌ | **基本完成** |
| 3 | activity-applications | ✅ | ✅ | ❌ (直调 Prisma) | ✅ | ❌ | **部分完成** |
| 4 | approval | ✅ | ✅ | ❌ (直调 Prisma) | ✅ | ❌ | **部分完成** |
| 5 | admin | ✅ | ✅ | ❌ (直调 Prisma) | ✅ | ❌ | **部分完成** |
| 6 | announcements | ❌ 501 | ❌ | ❌ | ❌ | ❌ | **未实现** |
| 7 | recruitment | ❌ 501 | ❌ | ❌ | ❌ | ❌ | **未实现** |
| 8 | checkin | ❌ 501 | ❌ | ❌ | ❌ | ❌ | **未实现** |
| 9 | closure | ❌ 501 | ❌ | ❌ | ❌ | ❌ | **未实现** |
| 10 | notifications | ❌ 501 | ❌ | ❌ | ❌ | ❌ | **未实现** |
| 11 | orgs | ❌ 501 | ❌ | ❌ | ❌ | ❌ | **未实现** |

**结论**：仅 5/11 个模块有实际代码，其中仅 2 个（auth / users）严格遵循 routes → service → repository 分层。6 个业务模块返回 501。

---

## 三、架构规范符合性

### 3.1 后端分层（对照 architecture.md §3）

| 规范要求 | 实际情况 | 判定 |
|---|---|---|
| routes 只做路由声明与参数提取 | ✅ auth、users 符合；activity-applications 等也基本符合 | ✅ 合格 |
| services 集中业务规则 | ✅ auth、users、admin 符合 | ✅ 合格 |
| repositories 封装数据访问 | ⚠️ 仅 auth、users 有独立 repository；其他模块 service 直接调 prisma | ⚠️ 部分偏离 |
| 外部输入经 Zod 校验 | ✅ 所有已实现模块均使用 Zod schema | ✅ 合格 |
| 跨模块调用通过 service 层 | N/A（尚无跨模块调用场景） | — |

**建议**：activity-applications、approval、admin 模块应补充 repository 层，将 Prisma 调用从 service 中抽离，便于单元测试和后续维护。

### 3.2 前端代码组织（对照 development-workflow.md §3.2）

| 规范要求 | 实际情况 | 判定 |
|---|---|---|
| 路由统一在 `router.tsx` 管理 | ✅ `App.tsx` 中集中管理路由 | ✅ 合格 |
| 请求统一通过 `shared/api/*` | ⚠️ 仅有 `auth.ts`、`users.ts` 两个 API 文件，其余页面仍使用 mock 数据 | ⚠️ 不完整 |
| 页面状态优先组件状态 | ✅ 大部分页面正确使用组件状态 | ✅ 合格 |
| 跨页面状态用 Zustand | ✅ auth store 正确使用 Zustand + persist | ✅ 合格 |

**建议**：为每个后端模块建立对应的前端 API 文件（`activity-applications.ts`、`approval.ts` 等），逐步替换 mock 数据。

### 3.3 统一响应格式（对照 api-design.md §3-4）

后端 `response.ts` 实现与设计文档一致：

- 成功：`{ data, meta? }` ✅
- 失败：`{ error: { code, message, details? } }` ✅
- 前缀 `/api/v1` ✅
- Swagger `/api-docs` ✅
- Bearer Token 鉴权 ✅

**问题**：Swagger 配置仅注册了 Health、Auth、Users 三个 tag（`swagger.ts` 第 18-29 行），admin、activity-applications 等已实现模块的 Swagger 注解未纳入 tag 列表。

---

## 四、前后端一致性问题（重点）

### 4.1 角色枚举不一致 ⚠️ 严重

| 位置 | 定义 |
|---|---|
| `shared/src/types/roles.ts` | `BASIC_USER`, `STUDENT`, `ORGANIZER`, `REVIEWER_L1`, `REVIEWER_L2`, `SYS_ADMIN` |
| 后端实际使用 | `BASIC_USER`, `ORGANIZER`, `REVIEWER`, `SYS_ADMIN` |
| Prisma seed/users 逻辑 | 使用 `REVIEWER`（无 L1/L2 后缀） |
| 前端 `store.ts` | `BASIC_USER`, `ORGANIZER`, `REVIEWER`, `SYS_ADMIN` |

**结论**：shared 包定义的 `REVIEWER_L1`、`REVIEWER_L2`、`STUDENT` 在后端和前端中均未实际使用。后端统一使用 `REVIEWER`（审核层级通过 approval_records.level 字段区分）。shared 包与实际代码脱节。

**建议**：将 shared/roles.ts 修正为实际使用的角色集合，或删除该文件统一使用后端 Prisma 枚举。

### 4.2 状态值大小写不一致 ⚠️ 严重

| 位置 | 状态值格式 |
|---|---|
| 后端 Prisma 枚举 | 大写：`DRAFT`, `SUBMITTED`, `APPROVING` 等 |
| 后端 API 返回 | 大写（Prisma 枚举原生值） |
| 前端 `shared/api/types.ts` | 大写：`'ACTIVE' \| 'DISABLED'` |
| 前端 `mock/data.ts` | **小写**：`'draft'`, `'submitted'`, `'approving'` 等 |

**结论**：前端 mock 数据使用全小写状态值（如 `'draft'`），但后端 API 返回大写（如 `'DRAFT'`）。当 mock 数据替换为真实 API 后，`StatusTag` 组件将无法正确匹配状态标签和颜色。

**建议**：将 `mock/data.ts` 及所有使用 mock 状态的组件统一改为大写枚举值，与后端 Prisma 枚举保持一致。

### 4.3 用户状态枚举不一致 ⚠️ 中等

- 后端 Prisma：`ACTIVE | BANNED`
- 前端 `types.ts` 第 8 行：`'ACTIVE' | 'DISABLED'`（写的是 DISABLED 而非 BANNED）

### 4.4 组织类型不一致 ⚠️ 中等

- 后端 Prisma：`CLUB | STUDENT_ORGANIZATION | ADMINISTRATION`
- 前端 `mock/data.ts`：`'department' | 'club' | 'office'`

### 4.5 前端 API 层覆盖不足 ⚠️ 中等

当前前端 `shared/api/` 目录仅有 2 个 API 文件（`auth.ts`、`users.ts`），但 `App.tsx` 路由中已定义了 25+ 个页面。大部分页面仍依赖 `mock/data.ts` 中的硬编码数据，未与后端接口对接。

---

## 五、测试覆盖评估

### 5.1 当前测试清单

| 测试文件 | 类型 | 用例数 | 覆盖模块 |
|---|---|---|---|
| `backend/.../health.routes.test.ts` | 后端单测 | 1 | health |
| `backend/.../auth.routes.test.ts` | 后端单测 | 4 | auth（注册、重复注册、登录、/users/me） |
| `frontend/src/app/App.test.tsx` | 前端组件测试 | 1 | LoginPage 渲染 |
| `frontend/tests/e2e/basic.spec.ts` | E2E | 1 | 首页渲染 |

**总计**：7 个测试用例，覆盖 3 个模块。

### 5.2 对照 testing.md 要求

| 要求 | 实际 | 判定 |
|---|---|---|
| 每个模块可被单独测试 | ❌ 仅 2.5 个模块有测试 | ❌ 不合格 |
| 统一测试入口 `pnpm -r test:run` | ⚠️ 虽可运行但覆盖率极低 | ⚠️ 形式合格 |
| 后端路由与服务层测试 | ⚠️ 仅有 auth | ⚠️ 严重不足 |
| 前端组件/页面测试 | ⚠️ 仅有 LoginPage | ⚠️ 严重不足 |
| shared schema/util 测试 | ❌ 无任何测试 | ❌ 不合格 |
| E2E 关键流程 | ❌ 仅有首页渲染 | ❌ 不合格 |
| 最小用例：health 200 + 首页渲染 | ✅ | ✅ 合格 |

### 5.3 缺失测试的关键模块

按优先级排列：

1. **activity-applications**：创建、更新、提交申请（3 个端点均无测试）
2. **approval**：待办查询（核心流程，无测试）
3. **admin**：权限申请提交与审核（涉及事务，无测试）
4. **users**：getMe、updateMe、updateProfile（虽有 service 但无路由测试）

---

## 六、数据库与 Prisma Schema

### 6.1 与需求文档对照

对照 `requirements.md §8` 列出的 9 个数据实体：

| 需求实体 | Prisma Model | 判定 |
|---|---|---|
| User | ✅ User + StudentProfile + TeacherProfile | ✅ 完整 |
| Organization | ✅ Organization | ✅ 完整 |
| ActivityApplication | ✅ ActivityApplication + ApplicationAttachment | ✅ 完整 |
| ApplicationAttachment | ✅ ApplicationAttachment | ✅ 完整 |
| ApprovalRecord | ✅ ApprovalRecord | ✅ 完整 |
| Recruitment | ✅ Recruitment + RecruitmentSignup | ✅ 完整 |
| Signup (报名记录) | ✅ RecruitmentSignup + SignupAttachment | ✅ 完整 |
| Checkin (签到记录) | ✅ CheckinSession + CheckinRecord | ✅ 完整 |
| Announcement (新闻通知) | ✅ Announcement + Notification | ✅ 完整 |

**额外实现**：Role、Permission、RoleApplication、PendingTask、SystemLog、ClosureApplication 等超出需求文档的基础实体，属于合理的架构扩展。

### 6.2 Schema 设计质量

- 枚举使用 `@map` 映射到 snake_case ✅
- 表名使用 `@@map` 映射 ✅
- 索引设置合理 ✅
- 外键约束与级联删除策略明确 ✅
- Prisma 注释清晰 ✅

**建议**：`PendingTask` 的 `relatedResourceType + relatedResourceId` 使用统一资源引用模式（已在注释中说明），但当前 `submitApplication` 中的待办生成逻辑（`activity-applications.service.ts` 第 60-80 行）使用"找任意 REVIEWER"的占位实现，需替换为基于组织树的审核人匹配逻辑。

---

## 七、代码质量问题

### 7.1 安全问题

| 问题 | 位置 | 严重程度 |
|---|---|---|
| 权限申请查询未校验 SYS_ADMIN 角色 | `admin.routes.ts:43` 注释自认 | ⚠️ 中 |
| JWT secret 有默认值 `dev_only_change_me...` | `config/env.ts:13` | ⚠️ 中（生产环境需强制设置） |
| 活动申请提交后随便找 REVIEWER 分配待办 | `activity-applications.service.ts:64-67` | ⚠️ 中（占位逻辑） |

### 7.2 代码组织问题

| 问题 | 位置 | 建议 |
|---|---|---|
| service 直接使用 `any` 类型 | `activity-applications.service.ts:5,21`，`approval.service.ts:4` | 用 Prisma 生成的类型或 Zod infer 类型替换 |
| 空 shared schemas | `shared/src/schemas/index.ts` | 将 backend 的 Zod schema 迁移至 shared，供前后端共享校验 |
| TypeScript `any` 用于 Prisma where 条件 | `approval.service.ts:5` | 使用 Prisma 生成的 `Prisma.PendingTaskWhereInput` 类型 |
| mock 数据文件 500+ 行 | `frontend/src/shared/mock/data.ts` | 按模块拆分为多个 mock 文件 |

### 7.3 缺失的 shared 共享

规范要求 shared 包承载共享类型、枚举、校验 schema，但当前：

- `shared/src/schemas/index.ts` 为空（`export {}`）
- 后端 Zod schema 散落在各模块中，前端无法复用
- shared 中的 roles 定义与实际使用不一致

---

## 八、分支与工程规范

对照 `development-workflow.md`：

| 规范 | 实际 | 判定 |
|---|---|---|
| main / develop / feature/* 分支 | 仅有 main 分支 | ⚠️ 偏离 |
| 合并前通过 lint + typecheck + test | 无法验证（多数模块无测试） | ❌ 不可行 |
| PR 描述含变更点、影响范围、测试方式 | 仅有单人提交，无 PR 记录 | — |

当前为单人开发模式，分支策略偏离可以理解，但后续多人协作时需恢复标准流程。

---

## 九、审查结论与整改建议

### 9.1 优先整改项（第一阶段：基础补全）

| 优先级 | 整改项 | 说明 |
|---|---|---|
| **P0** | 统一前后端状态值大小写 | mock/data.ts 改为大写枚举，与 Prisma 对齐 |
| **P0** | 修正 shared/roles.ts | 删除未使用的 `REVIEWER_L1/L2/STUDENT`，与实际角色对齐 |
| **P0** | 修正前端 UserDto.status 类型 | `'DISABLED'` → `'BANNED'` |
| **P0** | 实现 6 个 501 模块的核心路由 | announcements、recruitment、checkin、closure、notifications、orgs |

### 9.2 第二阶段：质量提升

| 优先级 | 整改项 | 说明 |
|---|---|---|
| **P1** | 为已实现模块补充测试 | activity-applications、approval、admin、users 至少各 3-5 个测试用例 |
| **P1** | 补充 repository 层 | activity-applications、approval、admin 将 Prisma 调用从 service 抽离 |
| **P1** | 前端 API 层补全 | 建立与后端模块对应的 API 文件，替换 mock 数据 |
| **P1** | 替换待办分配占位逻辑 | 实现基于组织树的审核人匹配（`activity-applications.service.ts:64`） |

### 9.3 第三阶段：完善与优化

| 优先级 | 整改项 | 说明 |
|---|---|---|
| **P2** | 将 Zod schema 迁移到 shared | 前后端共享校验逻辑 |
| **P2** | 补充 Swagger tag 注册 | 为所有已实现模块添加 Swagger 文档 |
| **P2** | 补充 E2E 测试 | 覆盖申请→审核→报名→签到→结项关键路径 |
| **P2** | 启用分支策略 | 建立 develop 分支，后续功能使用 feature 分支 |
| **P2** | 消除 TypeScript `any` 类型 | 为 service 层参数使用准确的 Prisma 类型 |

---

## 十、按模块详细审查意见

### 10.1 auth ✅ 质量较高

- 四层分层完整（routes → service → repository → schemas）
- JWT 签发与验证自行实现（非依赖 jsonwebtoken 库），使用 timingSafeEqual ✅
- 密码使用 scrypt + random salt ✅
- 测试覆盖注册、重复注册、登录、鉴权、错误密码 5 个场景 ✅
- Swagger 文档完整 ✅

### 10.2 users ✅ 基本完善

- 三层分层完整（routes → service → repository）
- Profile 编辑按 userType 区分处理 ✅
- Zod schema 含 `.strict()` + `.refine()` 校验 ✅
- 缺少路由测试 ⚠️

### 10.3 activity-applications ⚠️ 需改进

- 缺少 repository 层（service 直接调 prisma）
- `submitApplication` 中的审核人匹配为占位实现
- 缺少附件上传接口（DB schema 有 ApplicationAttachment 表但无对应 API）
- 缺少测试

### 10.4 approval ⚠️ 需改进

- 仅有 `GET /pending-tasks` 一个端点，缺少执行审核动作的接口（approve/reject/need_more）
- 缺少 repository 层
- 缺少测试

### 10.5 admin ⚠️ 需改进

- 角色申请与审核功能完整，含事务处理 ✅
- 权限校验缺失（SYS_ADMIN 检查未实现）
- 缺少 repository 层
- 缺少测试

### 10.6 未实现模块 ❌

announcements、recruitment、checkin、closure、notifications、orgs 六个模块需要从数据库设计出发，按照 auth 模块的分层模式逐一实现。

---
