# 代码审查报告

> 审查日期：2026-05-18  
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
| `docs/api-contract.md` | 前后端 API 契约（新增） |
| `docs/backend-todolist.md` | 后端待办清单（新增） |
| `docs/development-workflow.md` | 分支策略、代码组织、合并规范 |
| `docs/testing.md` | 测试分层与最小用例要求 |
| `docs/TEST_list.md` | 测试用例清单（新增） |
| `docs/tech-stack.md` | 技术栈约束 |

---

## 二、与上次审查的对比

### 2.1 已完成的改进

| 改进行 | 上次状态 | 当前状态 |
|---|---|---|
| 前端 API 层文件数 | 2 个（auth、users） | 15 个（覆盖全部 14 个模块组） |
| `dto.ts` 单一事实来源 | 无 | 463 行，13 个子模块类型定义 |
| role-applications 后端 | 不存在 | 4 个端点，完整 routes/service/schemas |
| 前端页面数 | 约 20 个 | 32 个 |
| 后端已实现模块 | 5/11 | 7/13 |
| 测试用例总数 | 约 7 个 | 26 个（11 个测试文件） |
| admin 页面数据来源 | 纯 mock | 真实 API + mock 兜底 |
| 文档 | 6 份 | 新增 api-contract.md、backend-todolist.md、TEST_list.md |

### 2.2 未修复的上轮 P0 问题

| 问题编号 | 问题描述 | 上次报告位置 | 当前状态 |
|---|---|---|---|
| **P0-1** | `shared/roles.ts` 定义了 `REVIEWER_L1`/`REVIEWER_L2`/`STUDENT` 但后端和前端均未使用 | 四.1 | ❌ 未修复，shared 与实际代码仍不一致 |
| **P0-2** | 前端 mock 数据使用小写状态值（`'draft'`），后端返回大写（`'DRAFT'`） | 四.2 | ❌ 未修复，mock/data.ts 前 500 行原型数据仍小写 |
| **P0-3** | 前端 `UserDto.status` 类型写 `'DISABLED'`，后端 Prisma 枚举是 `BANNED` | 四.3 | ❌ 未修复，7 处仍写 `DISABLED` |

**以上三个问题已被标记为 P0，建议立即修复。**

---

## 三、模块实现完成度

对照 `architecture.md` 规划的 13 个后端模块：

| 序号 | 模块 | 路由 | Service | Repository | Schema | 测试 | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | health | ✅ | 内联 | — | — | ✅ (1 case) | **已完成** |
| 2 | auth | ✅ | ✅ | ✅ | ✅ | ✅ (7 cases) | **已完成** |
| 3 | users | ✅ | ✅ | ✅ | ✅ | ✅ (6 cases) | **已完成** |
| 4 | activity-applications | ✅ | ✅ | ❌ (直调 Prisma) | ✅ | ❌ | **部分完成** |
| 5 | admin | ✅ | ✅ | ❌ (直调 Prisma) | ✅ | ❌ | **部分完成** |
| 6 | approval | ✅ | ✅ | ❌ (直调 Prisma) | ✅ | ❌ | **部分完成** |
| 7 | role-applications | ✅ | ✅ | ❌ (直调 Prisma) | ✅ | ❌ | **部分完成（新增）** |
| 8 | announcements | ❌ 501 | ❌ | ❌ | ❌ | ❌ | **未实现** |
| 9 | recruitment | ❌ 501 | ❌ | ❌ | ❌ | ❌ | **未实现** |
| 10 | checkin | ❌ 501 | ❌ | ❌ | ❌ | ❌ | **未实现** |
| 11 | closure | ❌ 501 | ❌ | ❌ | ❌ | ❌ | **未实现** |
| 12 | notifications | ❌ 501 | ❌ | ❌ | ❌ | ❌ | **未实现** |
| 13 | orgs | ❌ 501 | ❌ | ❌ | ❌ | ❌ | **未实现** |

**结论**：7/13 模块有实际代码，其中仅 2 个（auth、users）严格遵循 routes → service → repository 四层分层。6 个模块返回 501。

---

## 四、架构规范符合性

### 4.1 后端分层（对照 architecture.md §3）

| 规范要求 | 实际情况 | 判定 |
|---|---|---|
| routes 只做路由声明与参数提取 | ✅ 所有已实现模块均符合 | ✅ 合格 |
| services 集中业务规则 | ✅ 所有已实现模块均有 service | ✅ 合格 |
| repositories 封装数据访问 | ⚠️ 仅 auth、users 有独立 repository；其余 5 个模块 service 直接调 prisma | ⚠️ 部分偏离 |
| 外部输入经 Zod 校验 | ✅ 所有已实现模块均使用 Zod schema | ✅ 合格 |
| 跨模块调用通过 service 层 | ✅ role-applications/admin 涉及事务的审批逻辑正确放在 service 中 | ✅ 合格 |

**建议**：activity-applications、admin、approval、role-applications 四个模块应补充 repository 层（上次报告中已提出，仍未处理）。

### 4.2 前端代码组织（对照 development-workflow.md §3.2）

| 规范要求 | 实际情况 | 判定 |
|---|---|---|
| 路由统一管理 | ✅ `App.tsx` 集中管理所有路由，含 RequireAuth 和 RequireViewRole 守卫 | ✅ 合格 |
| 请求统一通过 `shared/api/*` | ✅ API 层已完整建立（15 个模块文件 + dto.ts） | ✅ 合格 |
| 页面状态优先组件状态 | ✅ 大部分页面正确使用组件状态 | ✅ 合格 |
| 跨页面状态用 Zustand | ✅ auth store 含多角色切换 + persist | ✅ 合格 |
| API 数据类型统一从 dto 导入 | ✅ dto.ts 463 行覆盖全部模块，已标注为单一事实来源 | ✅ 合格 |

**新增问题**：API 层代码已就绪，但仅 5 个用户/认证页面 + 7 个 admin 页面实际调用了 API。其余 20 个页面仍直接 import mock/data.ts 中的硬编码数据，从未调用 `@/shared/api` 中的对应函数。API 层和页面之间形成了"建好但没用"的脱节。

### 4.3 统一响应格式（对照 api-contract.md）

后端 `response.ts` 实现与设计文档一致：

- 成功：`{ data, meta? }` ✅
- 失败：`{ error: { code, message, details? } }` ✅
- 前缀 `/api/v1` ✅
- Swagger `/api-docs` ✅
- Bearer Token 鉴权 ✅
- api-contract.md 已完整记录全部 14 个模块组的 URL、Method、参数、错误码 ✅

**未修复问题**：Swagger 配置仅注册了 Health、Auth、Users 三个 tag（`swagger.ts` 第 17-30 行），admin、activity-applications、approval、role-applications 四个已实现模块的 Swagger 注解未纳入 tag 列表。上次报告中已指出，仍未处理。

---

## 五、前后端一致性问题（重点）

### 5.1 角色枚举不一致 ⚠️ 严重（旧问题）

| 位置 | 定义 |
|---|---|
| `shared/src/types/roles.ts` | `BASIC_USER`, `STUDENT`, `ORGANIZER`, `REVIEWER_L1`, `REVIEWER_L2`, `SYS_ADMIN` |
| 后端实际使用 | `BASIC_USER`, `ORGANIZER`, `REVIEWER`, `SYS_ADMIN` |
| Prisma seed/users 逻辑 | 使用 `REVIEWER`（无 L1/L2 后缀） |
| 前端 `store.ts` | `BASIC_USER`, `ORGANIZER`, `REVIEWER`, `SYS_ADMIN` |

**结论**：与上次报告完全一致——shared 包定义的 `REVIEWER_L1`、`REVIEWER_L2`、`STUDENT` 在后端和前端中均未实际使用。shared 包与实际代码持续脱节。

### 5.2 状态值大小写不一致 ⚠️ 严重（旧问题）

| 位置 | 状态值格式 |
|---|---|
| 后端 Prisma 枚举 | 大写：`DRAFT`, `SUBMITTED`, `APPROVING` |
| 后端 API 返回 | 大写（Prisma 枚举原生值） |
| 前端 `shared/api/dto.ts` | 大写 ✅（新增文件，设计正确） |
| 前端 `shared/api/types.ts` | 大写 ✅ |
| 前端 `mock/data.ts` 原型数据区（前 500 行） | **小写**：`'draft'`, `'submitted'`, `'approving'` |
| 前端 `mock/data.ts` fallback 数据区（后 300 行） | 大写 ✅ |

**结论**：好消息是新增的 `dto.ts` 和 `fallback` 数据使用了正确的大写枚举。坏消息是原型 mock 数据（前 500 行）仍然是全小写，而 20 个前端页面仍然引用这些数据。当页面切换到真实 API 后，现有效果依赖小写值的 StatusTag 组件将无法匹配。

### 5.3 用户状态枚举不一致 ⚠️ 中等（旧问题）

- 后端 Prisma：`ACTIVE | BANNED`
- 前端 `dto.ts`、`types.ts`、`admin.ts`：`'ACTIVE' | 'DISABLED'`（共 7 处）
- 后端 API 实际返回 `BANNED`，前端查询用 `DISABLED` → 禁用用户功能必然出错

### 5.4 前端 API 层与页面的数据源脱节 ⚠️ 中等（新问题）

API 层 15 个文件全部编写完毕，定义了对后端的真实 HTTP 调用，类型安全。但 32 个页面组件中有 20 个（约 63%）完全未使用这些 API 函数，仍直接从 `mock/data.ts` 导入数据。具体情况：

| 数据获取模式 | 页面数 | 页面列表 |
|---|---|---|
| 调用真实 API | 5 | LoginPage、RegisterPage、MePage、MeEditPage、MeProfilePage |
| 真实 API + mock 兜底 | 7 | AdminDashboard、AdminUsers、AdminUserDetail、AdminOrganizations、AdminSystemLogs、OrganizationsPage、TasksPage |
| 纯 mock 数据 | 20 | 其余全部页面（活动列表、活动详情、活动申请、审批、签到、结项、通知、招募、系统管理等核心业务流程页面） |

这意味着**核心业务流程的页面 100% 使用假数据**，无法与后端对接。

### 5.5 mock 数据文件结构问题 ⚠️ 低（新问题）

`mock/data.ts` 已达 799 行，包含两层数据（旧原型数据 + 新 fallback 数据），按模块拆分势在必行。文件内注释说明"这些数据仅在对应后端接口未就绪时作为兜底展示，方便答辩演示"，但 20 个页面并非"兜底"使用而是直接依赖，mock 数据事实上仍是主要数据源。

---

## 六、测试覆盖评估

### 6.1 当前测试清单

| 测试文件 | 类型 | 用例数 | 覆盖模块 |
|---|---|---|---|
| `shared/.../roles.test.ts` | shared 单测 | 2 | roles 常量值 |
| `backend/.../health.routes.test.ts` | 后端单测 | 1 | health |
| `backend/.../auth.routes.test.ts` | 后端单测 | 7 | auth（注册、重复注册、登录、鉴权、错误密码等） |
| `backend/.../users.routes.test.ts` | 后端单测 | 6 | users（更新信息、档案、校验等） |
| `frontend/src/app/App.test.tsx` | 前端组件测试 | 1 | LoginPage 渲染（注意：文件名是 App.test.tsx 但测的是 LoginPage） |
| `frontend/.../RegisterPage.test.tsx` | 前端组件测试 | 1 | RegisterPage 表单渲染 |
| `frontend/.../MeEditPage.test.tsx` | 前端组件测试 | 1 | MeEditPage 编辑字段渲染 |
| `frontend/.../MeProfilePage.test.tsx` | 前端组件测试 | 2 | 学生/教师档案字段区分 |
| `frontend/.../guards.test.tsx` | 前端组件测试 | 2 | 未登录重定向、已登录正常访问 |
| `frontend/.../AppLayout.test.tsx` | 前端组件测试 | 2 | 角色切换、登出清理 |
| `frontend/tests/e2e/auth-user-flow.spec.ts` | E2E | 1 | 注册→填资料→查看→登出流程（mock API 拦截） |

**总计**：26 个测试用例，11 个测试文件，覆盖 4 个模块。

### 6.2 对照 TEST_list.md 要求

`TEST_list.md` 列出了完整的测试计划。当前状态：

- 已标记 `[x]` 的项目与上述 26 个测试用例一致 ✅
- **未标记 `[x]` 的待补测试**包括：
  - `statuses` 枚举测试
  - `http.ts` API 响应结构测试
  - shared/Prisma 枚举一致性验证
  - admin role-application 测试（5 个子场景）
  - activity-application 路由测试
  - approval 路由测试
  - recruitment、signup、checkin、closure、notifications 全部后端测试
  - LoginPage 独立测试、RegisterPage 提交成功/失败测试
  - 各页面数据展示和交互测试
  - 真实后端 E2E 完整流程（7 个子场景）
  - CI 自动化配置

### 6.3 对照 testing.md 要求

| 要求 | 实际 | 判定 |
|---|---|---|
| 每个模块可被单独测试 | ❌ 仅 4/13 模块有测试 | ❌ 不合格 |
| 统一测试入口 `pnpm -r test:run` | ⚠️ 可运行但覆盖率很低 | ⚠️ 形式合格 |
| 后端路由与服务层测试 | ⚠️ 仅 auth、users | ⚠️ 严重不足 |
| 前端组件/页面测试 | ⚠️ 8 个用例覆盖 5 个组件（32 页面的 16%） | ⚠️ 严重不足 |
| shared schema/util 测试 | ⚠️ 仅 2 个 roles 常量断言 | ⚠️ 严重不足 |
| E2E 关键流程 | ⚠️ 仅 1 个 mock 流程 | ⚠️ 不合格 |

### 6.4 缺失测试的关键模块

按优先级排列：

1. **role-applications**（新增模块）：创建、查询、SYS_ADMIN 审核（涉及事务，无任何测试）
2. **activity-applications**：创建、更新、提交申请（4 个端点均无测试）
3. **approval**：待办查询（核心流程，无测试）
4. **admin**：角色申请与审核（有事务逻辑，无测试）

---

## 七、数据库与 Prisma Schema

### 7.1 Schema 设计质量

Schema 自上次审查以来无结构变更，质量评价维持不变：

- 枚举使用 `@map` 映射到 snake_case ✅
- 表名使用 `@@map` 映射 ✅
- 索引设置合理 ✅
- 外键约束与级联删除策略明确 ✅
- Prisma 注释清晰 ✅
- 20+ 张表覆盖全部业务实体 ✅

### 7.2 上次提出的建议处理情况

| 上次建议 | 当前状态 |
|---|---|
| 替换 activity-applications 中的"找任意 REVIEWER"占位逻辑 | ❌ 未处理，`activity-applications.service.ts` 中仍为占位实现 |
| 基于组织树的审核人匹配 | ❌ 未实现 |

---

## 八、代码质量问题

### 8.1 安全问题

| 问题 | 位置 | 严重程度 | 与上次对比 |
|---|---|---|---|
| JWT secret 有默认值 `dev_only_change_me...` | `config/env.ts:13` | ⚠️ 中 | 未修 |
| 活动申请提交后随便找 REVIEWER 分配待办 | `activity-applications.service.ts` 占位逻辑 | ⚠️ 中 | 未修 |
| role-applications 审批无 SYS_ADMIN 权限校验 | `role-applications.service.ts`（代码中无显式角色检查） | ⚠️ 中 | 新增 |

### 8.2 代码组织问题

| 问题 | 位置 | 建议 | 与上次对比 |
|---|---|---|---|
| service 直接使用 `any` 类型 | `activity-applications.service.ts`、`approval.service.ts` | 用 Prisma 生成类型替换 | 未修 |
| shared schemas 空占位 | `shared/src/schemas/index.ts` 仅 `export {}` | 将后端 Zod schema 迁入 shared | 未修 |
| mock 数据 799 行 | `frontend/src/shared/mock/data.ts` | 按模块拆分或逐步淘汰 | 比上次更严重（500+→799） |
| `App.test.tsx` 名不副实 | 文件测试的是 LoginPage 而非 App 组件 | 重命名为 `LoginPage.test.tsx` 或改为测试 App | 新增发现 |

### 8.3 前端页面功能缺陷（新增发现）

| 问题 | 位置 | 说明 |
|---|---|---|
| MyApplicationsPage 含无效路由链接 | `MyApplicationsPage.tsx` | 表格链接指向 `/applications/:id` 和 `/applications/:id/edit`，但这两个路由在 `App.tsx` 中未注册对应页面组件 |
| AnnouncementManagePage 编辑/下架无事件处理 | `AnnouncementManagePage.tsx` | "编辑"和"下架"链接是 `<a>` 标签，无 `onClick` 处理函数 |
| CheckinPage 签到场次仅操作本地 state | `CheckinPage.tsx` | 创建场次、签到记录均不调用 API，刷新页面后丢失 |

---

## 九、分支与工程规范

对照 `development-workflow.md`：

| 规范 | 实际 | 判定 |
|---|---|---|
| main / develop / feature/* 分支 | 仅有 main 分支 | ⚠️ 偏离（与上次一致，单人开发可理解） |
| 合并前通过 lint + typecheck + test | 可运行但覆盖率不足 | ⚠️ 形式合格 |
| PR 描述含变更点、影响范围、测试方式 | 单人提交无 PR 记录 | — |

此外，新增 `dev-doctor.mjs`（环境体检脚本）和 `screenshots.mjs`（自动截图脚本）属于工程化改进。

---

## 十、审查结论与整改建议

### 10.1 第一阶段：修复原有问题

| 优先级 | 整改项 | 说明 | 首次提出 |
|---|---|---|---|
| **P0** | 修正 shared/roles.ts | 删除 `REVIEWER_L1`/`REVIEWER_L2`/`STUDENT`，与实际使用的 4 个角色对齐 | 5月8日 |
| **P0** | 修正前端 UserDto.status 类型 | 7 处 `'DISABLED'` → `'BANNED'` | 5月8日 |
| **P0** | 统一 mock 数据大小写 | 旧 mock 数据 500 行的状态值改为大写枚举 | 5月8日 |
| **P1** | 修复 AnnouncementManagePage 编辑/下架无响应 | 补充 onClick 处理函数 | 新发现 |
| **P1** | 修复 MyApplicationsPage 无效路由 | 注册对应页面组件路由或移除无效链接 | 新发现 |

### 10.2 第二阶段：后端补全核心模块（按 backend-todolist.md 排期）

| 优先级 | 整改项 | 说明 |
|---|---|---|
| **M1** | 实现 organizations 模块 | 7 个端点（含组织树、CRUD、用户组织管理），seed 数据需含完整组织树 |
| **M1** | 实现 pending-tasks 模块 | 3 个端点（待办列表、详情、处理） |
| **M2** | 补全 activity-applications 模块 | 附件上传接口、审核人匹配逻辑替换占位实现 |
| **M2** | 实现 approval 审核执行端点 | 当前仅有 GET /pending-tasks，缺少审核动作接口 |
| **M3** | 实现 recruitment + activities + organizations | 招募、报名、活动管理等全流程 |
| **M4** | 实现 checkin + closure | 签到和结项全流程 |
| **M5** | 实现 announcements + notifications + admin | 公告、通知、系统管理后台 |

### 10.3 第三阶段：质量提升

| 优先级 | 整改项 | 说明 |
|---|---|---|
| **P1** | 为 activity-applications、approval、admin、role-applications 补充测试 | 每个模块至少 3-5 个测试用例 |
| **P1** | 前端页面接入 API 层 | 将 20 个纯 mock 页面逐步替换为真实 API 调用 |
| **P1** | 补充 repository 层 | activity-applications、approval、admin、role-applications 将 Prisma 从 service 抽离 |
| **P2** | 将 Zod schema 迁移到 shared | `shared/src/schemas/index.ts` 从空占位变为实际共享校验 |
| **P2** | 补充 Swagger tag 注册 | 为 activity-applications、admin、approval、role-applications 添加文档 |
| **P2** | 补充 E2E 测试 | 覆盖申请→审核→招募→报名→签到→结项关键路径 |
| **P2** | 消除 TypeScript `any` 类型 | 为 service 层参数使用准确的 Prisma 类型 |
| **P2** | 拆分 mock/data.ts | 按模块拆分或启用 `mock/` 目录结构 |

---

## 十一、按模块详细审查意见

### 11.1 health ✅ 无变化

- 极简实现，1 个端点，1 个测试 ✅

### 11.2 auth ✅ 质量最高

- 四层分层完整（routes → service → repository → schemas）✅
- JWT 自行实现（非第三方库），含 timingSafeEqual ✅
- 密码使用 scrypt + random salt ✅
- 测试覆盖 7 个场景（注册、重复注册、登录、鉴权、错误密码）✅
- Swagger 文档完整 ✅
- 与上次审查无变化

### 11.3 users ✅ 基本完善

- 三层分层完整 ✅
- Profile 编辑按 userType 区分处理 ✅
- Zod schema 含 `.strict()` + `.refine()` 校验 ✅
- 新增 6 个测试用例（上次审查后补充）✅

### 11.4 role-applications 🆕 新增模块，质量中等

- routes + service + schemas 三层完整 ✅
- 事务处理（审批通过时同时创建 UserRole + UserOrganization）✅
- REVIEWER 必须为教师、REVIEWER/ORGANIZER 需要 organizationId 等业务规则校验 ✅
- 缺少 repository 层 ⚠️
- 无任何测试 ❌
- 权限校验缺失（SYS_ADMIN 检查未实现）⚠️

### 11.5 activity-applications ⚠️ 无变化（上次问题全部遗留）

- 缺少 repository 层（service 直接调 prisma）
- `submitApplication` 中的审核人匹配为占位实现
- 缺少附件上传接口（DB 有 ApplicationAttachment 表但无 API）
- 缺少测试

### 11.6 approval ⚠️ 无变化

- 仅有 `GET /pending-tasks` 一个端点，缺少执行审核动作的接口
- 缺少 repository 层
- 缺少测试

### 11.7 admin ⚠️ 无变化

- 角色申请与审核功能完整，含事务处理 ✅
- 权限校验缺失 ⚠️
- 缺少 repository 层
- 缺少测试

### 11.8 未实现模块 ❌（6 个，与上次持平）

announcements、recruitment、checkin、closure、notifications、orgs 六个模块仍需从数据库设计出发，按照 auth 模块的分层模式逐一实现。`backend-todolist.md` 已经给出了按 M1-M5 优先级的实现排期。

### 11.9 前端整体评估

**亮点**：
- API 层 (`shared/api/`) 设计质量高，15 个模块文件 + dto.ts 463 行类型定义，覆盖全面
- 32 个页面的 UI 均完整，使用 Ant Design 组件规范
- AppLayout 多角色菜单 + 角色切换功能设计合理
- 认证守卫（RequireAuth + RequireViewRole）到位

**不足**：
- 20/32 页面仍使用纯 mock 数据，API 层建好未用
- 页面测试覆盖率极低（8 个组件测试 / 32 个页面）
- E2E 测试使用 mock API 拦截而非真实后端
- 3 个页面功能缺陷需修复（见 8.3 节）

---
