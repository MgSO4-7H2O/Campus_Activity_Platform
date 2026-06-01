# 测试设计与维护说明

本文档用于长期维护项目测试体系。每次新增功能、修改业务流程或补充测试后，都应同步更新本文档和 `docs/TEST_list.md`，确保测试范围、测试结果、运行方式和已知问题保持可追踪。

最近验证日期：2026-06-02

## 1. 维护目标

1. 用自动化测试持续验证已实现功能，避免核心流程回归。
2. 让每个功能模块都有明确的测试入口、测试点和结果记录。
3. 将测试缺口显式记录，避免“已有测试”与“功能完整可靠”混淆。
4. 保持测试命令稳定可复用，支持本地验收和后续 CI 接入。

## 2. 测试分层设计

| 层级 | 工具 | 目录 | 目标 |
| --- | --- | --- | --- |
| shared 契约测试 | Vitest | `shared/src/**/*.test.ts` | 验证跨端共享类型、状态常量、响应契约 |
| 后端接口/模块测试 | Vitest + Supertest + Prisma | `backend/src/**/*.test.ts` | 验证 API 鉴权、参数校验、数据库写入和核心业务状态变化 |
| 前端组件/页面测试 | Vitest + React Testing Library | `frontend/src/**/*.{test,spec}.tsx` | 验证页面渲染、表单校验、筛选、路由跳转和关键交互 |
| 前端 E2E | Playwright | `frontend/tests/e2e/*.spec.ts` | 验证浏览器中的关键前端流程 |
| 真实联调 E2E | Playwright + backend + PostgreSQL | `frontend/tests/e2e-real/*.spec.ts` | 验证浏览器、真实 API、真实数据库之间的闭环 |
| 压力与性能烟测 | tsx + Supertest + Prisma + PostgreSQL | `backend/src/performance/*.ts` | 验证真实后端核心接口在小规模并发下的响应时间、数据一致性和清理能力 |
| 覆盖率 | Vitest coverage v8 | `*/coverage` | 观察模块测试覆盖情况，定位后续补测重点 |

常规前端 E2E 仍以 mock API 或前端本地状态为主；真实联调 E2E 单独使用 `frontend/playwright.real.config.ts` 启动真实后端和前端服务。

## 3. 当前测试结果快照

| 项目 | 当前结果 | 命令 |
| --- | ---: | --- |
| 单元/模块测试合计 | 156 passed | `pnpm --filter @campus-activity/shared test:run` + `pnpm --filter @campus-activity/server test:run` + `pnpm --filter @campus-activity/web test:run` |
| shared 测试 | 7 passed | `pnpm --filter @campus-activity/shared test:run` |
| backend 测试 | 101 passed | `pnpm --filter @campus-activity/server test:run` |
| frontend 组件/页面测试 | 48 passed | `pnpm --filter @campus-activity/web test:run` |
| frontend E2E | 3 passed | `pnpm --filter @campus-activity/web test:e2e` |
| 真实后端 + PostgreSQL E2E | 2 passed | `pnpm --filter @campus-activity/web test:e2e:real` |
| 压力与性能烟测 | 4 scenarios passed；p95 分别为 79ms、46ms、41ms、24ms | `pnpm --filter @campus-activity/server test:perf` |
| 全仓类型检查 | passed | `pnpm typecheck` |
| 全仓 lint | passed，49 warnings | `pnpm lint` |

最近覆盖率结果为上次生成结果；新增 shared/Prisma enum 契约、admin、organizations、activities、role-applications、activity-applications 附件/审核权限/审核拒绝/退回/最终通过/审核记录、recruitment 非法状态发布、signup 附件/详情权限/容量释放、checkin QRCODE/权限/时间边界/取消报名、announcements、notifications、MePage、activities、recruitment、closure、auth/users 边界、pending-tasks 详情/处理、closure 拒绝/退回/重复结项/附件、LoginPage/RegisterPage/MeEditPage/MeProfilePage/ActivityApplyPage/AdminUsersPage/AdminOrganizationsPage/TasksPage、审核拒绝/退回补材料、结项提交成功、真实业务主链路 E2E 等测试后，尚未重新生成 coverage：

| 包 | 语句覆盖率 | 分支覆盖率 | 说明 |
| --- | ---: | ---: | --- |
| backend | 70.67% | 69.94% | 历史覆盖率报告；本轮新增大量接口测试后需重新生成 |
| frontend | 24.30% | 56.47% | 历史覆盖率报告；本轮新增页面测试后需重新生成 |
| shared | 54.76% | 0% | 历史覆盖率报告；当前已覆盖 roles、statuses、http 契约和 shared/Prisma enum 一致性 |

覆盖率报告位置：

- `backend/coverage/index.html`
- `frontend/coverage/lcov-report/index.html`
- `shared/coverage/index.html`

## 4. 运行前准备

后端测试依赖 `backend/.env` 中的 `DATABASE_URL`。本地运行前需确认 Docker 环境已启动：

```bash
docker compose up -d postgres redis adminer
docker ps
```

首次初始化或数据库结构变化后，运行：

```bash
pnpm --filter @campus-activity/server db:generate
pnpm --filter @campus-activity/server db:migrate
pnpm --filter @campus-activity/server db:seed
```

Playwright 首次运行前安装浏览器：

```bash
pnpm --filter @campus-activity/web exec playwright install chromium
```

真实联调 E2E 会自动启动：

- backend：`http://localhost:3100/api/v1`
- frontend：`http://localhost:5174`

真实联调 E2E 当前使用 `backend/.env` 指向的 PostgreSQL。运行前需保证数据库结构已准备好。测试创建的 `real...` 用户、真实联调组织、权限申请、立项申请、待办和活动会在测试结束后由 `backend/src/test/real-e2e-cleanup.ts` 清理。

压力与性能烟测当前使用 `backend/.env` 指向的 PostgreSQL，通过 `createApp()` 直接执行真实 Express 路由和 Prisma 数据库访问，不额外启动端口。测试数据使用 `perf_${RUN_ID}_` 业务前缀和 `perf${RUN_ID}` 用户名前缀运行前后清理，脚本结束后校验用户、组织、活动残留为 0。

后端 Vitest 测试使用 `backend/src/test/fixtures.ts` 中的 `cleanupTestData()` 在每个用例前清理测试 fixture 数据，保证用例之间的数据隔离。真实联调 E2E 使用唯一 `real...` 用户名、邮箱和手机号，并在每个用例结束后调用 `backend/src/test/real-e2e-cleanup.ts` 清理真实流程创建的用户、profile、组织和业务资源。

CI 使用 `.github/workflows/test.yml` 启动独立 PostgreSQL service，数据库名为 `campus_test`，并在该库中执行 Prisma `db:push`、typecheck、三端 Vitest、mock E2E 和真实 E2E。

注意：项目 `engines` 要求 Node.js `>=22.0.0`。本地和 CI 应统一使用 Node.js 22 或更高版本，避免 engine warning 和依赖运行时差异。

## 5. 常用测试命令

| 场景 | 命令 |
| --- | --- |
| 全仓统一测试 | `pnpm -r test:run` |
| 后端接口测试 | `pnpm --filter @campus-activity/server test:run` |
| 前端组件/页面测试 | `pnpm --filter @campus-activity/web test:run` |
| shared 契约测试 | `pnpm --filter @campus-activity/shared test:run` |
| E2E 测试 | `pnpm --filter @campus-activity/web test:e2e` |
| 真实后端 + PostgreSQL E2E | `pnpm --filter @campus-activity/web test:e2e:real` |
| 压力与性能烟测 | `pnpm --filter @campus-activity/server test:perf` |
| 后端覆盖率 | `pnpm --filter @campus-activity/server test:coverage` |
| 前端覆盖率 | `pnpm --filter @campus-activity/web test:coverage` |
| shared 覆盖率 | `pnpm --filter @campus-activity/shared test:coverage` |
| 类型检查 | `pnpm typecheck` |
| lint | `pnpm lint` |
| 一键检查 | `pnpm check` |

在 Codex 沙箱内，后端 Supertest 的临时监听和 Postgres 连接可能被限制。若 `pnpm -r test:run` 在沙箱内失败，但单独后端测试或非沙箱运行通过，应优先按非沙箱结果判断真实项目状态。

## 6. 已覆盖功能点

### 6.1 shared

| 测试文件 | 覆盖点 |
| --- | --- |
| `shared/src/types/roles.test.ts` | `BASIC_USER`、`ORGANIZER`、`REVIEWER`、`SYS_ADMIN` 等角色常量基础契约 |
| `shared/src/types/statuses.test.ts` | 活动申请 workflow 状态、报名状态常量 |
| `shared/src/types/http.test.ts` | 成功响应 metadata、失败响应 error 字段契约 |
| `shared/src/types/prisma-contract.test.ts` | `ActivityApplicationStatus` 与 Prisma enum 同步，`SignupStatus` 公共 API 命名与 Prisma 存储 enum 映射同步 |

### 6.2 backend

| 模块 | 测试文件 | 覆盖点 |
| --- | --- | --- |
| health | `backend/src/modules/health/health.routes.test.ts` | `GET /api/v1/health` 返回 200 和 `ok` |
| auth | `backend/src/modules/auth/auth.routes.test.ts` | 学生/教师注册、缺字段、短用户名、重复 username/email/phone、登录成功、密码错误、被封禁用户登录失败、封禁后旧 token 访问受保护接口失败、未登录访问 |
| users | `backend/src/modules/users/users.routes.test.ts` | 基础信息更新、email/phone 冲突、非法 email、无效 token、学生 profile、教师 profile、grade 类型校验、`/users/me/roles` |
| real E2E cleanup | `backend/src/test/real-e2e-cleanup.test.ts` | 删除真实 E2E 测试用户，验证学生 profile 级联删除，并清理真实业务主链路创建的组织、权限申请、立项申请、待办和活动 |
| role-applications | `backend/src/modules/role-applications/role-applications.routes.test.ts` | 未登录拒绝、创建 ORGANIZER 申请、本人申请列表、重复待审申请拒绝、student 申请 REVIEWER 拒绝、teacher 申请 REVIEWER、缺组织拒绝、非 SYS_ADMIN 审核拒绝、审核通过写角色和组织绑定、审核拒绝、重复审核拒绝 |
| activity-applications | `backend/src/modules/activity-applications/activity-applications.routes.test.ts` | 未登录拒绝、创建草稿、非法组织、草稿更新、非申请人拒绝、提交后创建 reviewer 待办、附件上传/查询/删除、跨 application 删除附件拒绝、审核详情权限、非当前审核人 review 拒绝、审核拒绝、退回补材料后重新提交、最终通过生成活动、审核记录列表 |
| approval / pending-tasks | `backend/src/modules/approval/approval.routes.test.ts` | 待办鉴权、只返回当前用户待办、按 `status` 过滤、待办详情、非分配人详情拒绝、分配人处理、非分配人处理拒绝、重复处理拒绝、非法过滤参数拒绝 |
| announcements / notifications | `backend/src/modules/announcements/announcements.routes.test.ts` | SYS_ADMIN 创建公告草稿、发布公告、写入发布事件、BASIC_USER 收到未读通知、通知列表、单条已读、全部已读、已读/未读筛选、读取其他用户通知拒绝、普通用户创建公告拒绝 |
| recruitment / signup | `backend/src/modules/recruitment/recruitment-signups.routes.test.ts` | 创建招募草稿、编辑招募、发布招募、关闭招募、关闭后再次发布拒绝、非负责人编辑拒绝、活动进入 RECRUITING、学生报名、重复报名拒绝、取消报名、取消后释放容量、报名附件上传、申请人和负责人可见报名附件、无关用户读取报名详情/上传附件拒绝、创建报名审核待办、负责人审核通过/拒绝、非负责人审核拒绝、待办完成、通知申请人、容量满员拒绝、报名时间窗拒绝、用户类型/年级/专业限制拒绝 |
| checkin | `backend/src/modules/checkin/checkin.routes.test.ts` | 创建签到码场次、开启场次、统计已通过报名人数、签到码签到、重复签到冲突、查询签到记录、未开启/已关闭签到拒绝、错误签到码拒绝、未通过报名用户拒绝、取消报名用户拒绝、手动补签、关闭场次、QRCODE token 签到、非负责人管理拒绝、签到开始和结束时间边界 |
| closure | `backend/src/modules/closure/closure.routes.test.ts` | 创建结项草稿、提交后创建结项审核待办、审核通过、活动变为 CLOSED、查询审核记录、通知负责人、附件上传、非申请人上传附件拒绝、非负责人提交拒绝、未结束活动提交拒绝、重复结项拒绝、非审核人拒绝、审核拒绝、退回补材料后更新并重新提交 |
| admin | `backend/src/modules/admin/admin.routes.test.ts` | 非 SYS_ADMIN 访问拒绝、用户列表和角色过滤、用户详情、用户状态管理、dashboard、系统日志查询 |
| organizations | `backend/src/modules/orgs/orgs.routes.test.ts` | 组织列表和类型过滤、组织树、组织详情、SYS_ADMIN 创建/更新组织、用户组织绑定/查询/解绑、重复绑定拒绝、解绑不存在关系拒绝、非 SYS_ADMIN 写操作拒绝 |
| activities | `backend/src/modules/activities/activities.routes.test.ts` | 活动列表状态/关键词过滤、活动详情、我的活动、开始活动、结束活动、非负责人操作拒绝、非法状态流转拒绝 |

后端测试数据辅助：

- `backend/src/test/fixtures.ts`
- 提供核心角色初始化、用户/组织/活动等 fixture 创建与清理能力。

### 6.3 压力与性能烟测

| 测试入口 | 覆盖点 |
| --- | --- |
| `backend/src/performance/perf-smoke.ts` | 真实后端 + PostgreSQL 登录与 `/users/me`、活动列表查询、16 用户并发报名、16 用户并发签到、重复签到冲突、报名/签到业务一致性、按 `perf_${RUN_ID}_` 前缀清理和残留校验 |
| `backend/src/performance/perf-metrics.test.ts` | 性能统计辅助函数：请求数、失败数、p50、p95、max、阈值失败错误信息 |

最近一次性能烟测结果：

| 场景 | 请求数 | 失败数 | p50 | p95 | max | 阈值 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 登录与当前用户信息 | 10 | 0 | 61ms | 79ms | 79ms | 3000ms |
| 常规活动列表查询 | 20 | 0 | 39ms | 46ms | 46ms | 3000ms |
| 报名高峰 | 16 | 0 | 39ms | 41ms | 41ms | 3000ms |
| 签到高峰 | 16 | 0 | 23ms | 24ms | 24ms | 3000ms |

### 6.4 frontend 组件/页面

| 页面/组件 | 测试文件 | 覆盖点 |
| --- | --- | --- |
| LoginPage | `frontend/src/app/App.test.tsx`、`frontend/src/modules/auth/LoginPage.test.tsx` | 登录表单基础渲染、登录成功保存 session 并回跳来源页、登录失败展示后端错误且不写入 session |
| RegisterPage | `frontend/src/modules/auth/RegisterPage.test.tsx` | 注册表单字段渲染、注册成功保存 session 并跳转资料页、注册失败展示后端错误且不写入 session |
| MeEditPage | `frontend/src/modules/users/MeEditPage.test.tsx` | 基础信息编辑字段渲染、保存成功更新 auth store 并跳转 `/me`、保存失败展示后端错误并保留输入 |
| MeProfilePage | `frontend/src/modules/users/MeProfilePage.test.tsx` | 学生/教师扩展资料字段差异、学生 profile 保存成功/失败、教师 profile 保存成功/失败、保存成功更新 auth store 并跳转 `/me`、保存失败保留输入 |
| MePage | `frontend/src/modules/users/MePage.test.tsx` | 账号信息、角色、学生 profile 展示，profile 空状态，刷新重新请求当前用户 |
| RequireAuth | `frontend/src/shared/auth/guards.test.tsx` | 未登录跳转 `/login`、已登录渲染子内容 |
| AppLayout | `frontend/src/shared/components/AppLayout.test.tsx` | 多角色视图切换、角色菜单、退出登录清 session 并跳转 |
| ActivityApplyPage | `frontend/src/modules/activity-applications/ActivityApplyPage.test.tsx` | 从 API 加载可选组织、保存草稿、创建后提交审核、后端错误提示并保留表单 |
| MyApplicationsPage | `frontend/src/modules/activity-applications/MyApplicationsPage.test.tsx` | 申请列表渲染、按活动名称搜索、进行中筛选 |
| ReviewerInboxPage | `frontend/src/modules/approval/ReviewerInboxPage.test.tsx` | 待办列表渲染、按活动名称/组织搜索、进入审核详情 |
| ReviewerDetailPage | `frontend/src/modules/approval/ReviewerDetailPage.test.tsx` | 申请详情、附件、审核历史、空意见阻止确认、通过/驳回/退回补材料确认与返回待办、缺失申请空状态 |
| NotificationCenterPage | `frontend/src/modules/notifications/NotificationCenterPage.test.tsx` | 未读筛选、单条标记已读、全部标记已读 |
| CheckinPage | `frontend/src/modules/checkin/CheckinPage.test.tsx` | 已有签到场次、签到码展示、创建手动签到场次 |
| ActivityListPage / ActivityDetailPage | `frontend/src/modules/activities/ActivityPages.test.tsx` | 活动状态筛选、关键词搜索、详情页报名/签到入口、活动不存在空状态 |
| ActivityRegisterPage / MyRegistrationsPage | `frontend/src/modules/recruitment/RecruitmentPages.test.tsx` | 已发布招募报名表单、未开放报名提示、我的报名状态、通过后去签到入口、拒绝理由 |
| ClosureApplyPage | `frontend/src/modules/closure/ClosureApplyPage.test.tsx` | 结项表单字段、附件上传区域、活动总结长度校验、提交成功后返回我的活动 |
| AdminUsersPage | `frontend/src/modules/admin/AdminUsersPage.test.tsx` | 用户管理 API 数据渲染、关键词筛选 |
| AdminOrganizationsPage | `frontend/src/modules/admin/AdminOrganizationsPage.test.tsx` | 组织树 API 数据渲染、新增组织弹窗入口 |
| TasksPage | `frontend/src/modules/tasks/TasksPage.test.tsx` | 待办 API 数据渲染、按处理状态筛选 |

前端测试环境：

- `frontend/src/__tests__/setup.ts`
- 已补 `matchMedia`、`ResizeObserver`、`getComputedStyle`，用于稳定 Ant Design 组件在 jsdom 下的测试。

### 6.5 frontend E2E

| 流程 | 测试文件 | 覆盖点 |
| --- | --- | --- |
| 用户注册-资料-退出闭环 | `frontend/tests/e2e/auth-user-flow.spec.ts` | mock 注册 API、跳转资料页、修改学生 profile、查看个人信息、退出登录、受保护路由回登录页 |
| 组织者立项申请前端流程 | `frontend/tests/e2e/organizer-reviewer-flow.spec.ts` | 注入 ORGANIZER 登录态、打开 `/applications`、进入 `/applications/new`、空表单提交触发表单校验 |
| 审核人处理立项待办前端流程 | `frontend/tests/e2e/organizer-reviewer-flow.spec.ts` | 注入 REVIEWER 登录态、打开 `/approvals`、进入审核详情、填写审核意见、打开确认弹窗、确认后返回 `/approvals` |
| 真实后端注册-资料-重登闭环 | `frontend/tests/e2e-real/auth-real-backend.spec.ts` | 自动启动真实 backend 和 frontend，连接 PostgreSQL，浏览器注册唯一测试用户，修改学生 profile，退出后重新登录，验证 profile 数据持久化，测试结束后清理用户并验证无法再次登录 |
| 真实业务权限-立项-审核闭环 | `frontend/tests/e2e-real/activity-approval-real-backend.spec.ts` | 自动创建唯一真实联调用户、管理员、审核人和组织，提交 ORGANIZER 权限申请，管理员审核后角色生效，提交立项，审核人通过后生成 PLANNED 活动，并清理用户、组织、申请、待办和活动 |

## 7. 当前未覆盖或覆盖不足的区域

后续不再按“尽可能穷尽”扩展测试。已经实现并通过的测试保留；尚未实现的计划只保留高风险、低维护成本的回归点，避免测试规模继续拖慢开发节奏。

| 区域 | 当前覆盖 | 保留的关键补测 |
| --- | --- | --- |
| 后端核心状态流转 | 已覆盖注册登录、用户资料、角色申请、立项审核、待办、招募报名、签到、结项、公告通知、组织和后台管理的主要成功/失败路径 | 不再按模块逐项扩充；只在发现权限绕过、非法状态流转或脏数据风险时补回归测试 |
| 后端数据隔离 | 模块测试已用 fixture 清理；真实 E2E 已清理注册/profile 测试用户 | 真实 E2E 若新增活动/申请/报名/签到/结项资源，先扩展按前缀清理和残留检测 |
| 前端页面 | 已覆盖登录注册、个人中心、立项申请、审核、活动/招募/签到/结项、通知、用户管理、组织管理、待办列表、审核拒绝/退回补材料、结项提交成功的关键渲染和交互 | 当前不再新增页面测试；后续仅在功能变更时补对应关键用例 |
| E2E | 已有 mock 注册-profile-退出、mock 立项/审核流程、真实注册-profile-重登闭环、真实权限申请-立项审核-活动生成闭环 | 当前真实业务 smoke 已覆盖；后续只在新增主流程时补新的真实 E2E |
| 压力与性能 | 已实现真实后端 + PostgreSQL 性能烟测，覆盖登录、活动查询、报名高峰、签到高峰、数据清理 | 不做长时间持续负载、多审核人并发处理和附件上传压力；若验收要求扩大，再作为专项测试补充 |
| 覆盖率与 CI | 已有历史 coverage，命令已记录 | 暂不为覆盖率数字扩规模；后续只在 CI 固化 `typecheck`、三端 Vitest、必要 E2E |

## 8. 已知问题与风险

1. 全仓 lint 当前通过但仍有 49 个 backend warning，主要是 `@typescript-eslint/no-explicit-any`。
2. 前端 `AppLayout.test.tsx` 仍会输出 React `act(...)` warning。测试通过，但后续应收敛异步状态更新断言。
3. Ant Design v5 在 React 19 下会输出兼容 warning。测试通过，但需要关注 UI 组件库升级或兼容适配。
4. `ClosureApplyPage.test.tsx` 会输出 Ant Design `InputNumber addonAfter` deprecated 和 `Upload value` warning。测试通过，但页面实现后续应改用 `Space.Compact` 和受控 `fileList`。
5. Playwright webServer 会输出 `NO_COLOR` 被 `FORCE_COLOR` 覆盖的 warning，不影响结果，但会污染日志。
6. 本地后端测试和真实联调 E2E 当前仍默认使用 `backend/.env` 指向的数据库；CI 已使用独立 `campus_test`。
7. 真实联调 E2E 清理已覆盖用户、profile、组织、权限申请、立项申请、待办和活动；若未来真实 E2E 创建报名、签到或结项数据，需要同步扩展清理脚本。
8. 新增测试后尚未重新生成 coverage，当前覆盖率数字只能作为历史参考。
9. Codex 沙箱内 `tsx` 创建 IPC pipe 会触发 `listen EPERM`，真实 E2E 和 `test:perf` 需要在非沙箱环境运行。

## 9. 新功能测试维护流程

每次新增或修改功能时，按以下流程更新测试：

1. 先确认功能归属模块和业务边界。
2. 后端功能优先补接口/模块测试，覆盖成功路径、鉴权、参数校验和关键状态变化。
3. 前端页面优先补组件/页面测试，覆盖渲染、输入、筛选、提交、错误提示和路由跳转。
4. 跨页面关键链路补 E2E，优先覆盖用户实际操作路径。
5. 测试通过后更新 `docs/TEST_list.md` 的勾选项。
6. 更新本文档：
   - `当前测试结果快照`
   - `已覆盖功能点`
   - `未覆盖或覆盖不足的区域`
   - `已知问题与风险`
   - 覆盖率数字和报告路径
7. 运行对应验证命令，并在提交或交付说明中写清楚实际执行结果。

新增测试时应避免：

- 只断言组件存在而不验证业务行为。
- 用过度 mock 掩盖真实状态流转问题。
- 在测试里吞掉错误或绕过真实校验。
- 让测试依赖执行顺序、共享脏数据或开发者本地临时数据。

## 10. 文档更新模板

新增功能测试完成后，在本文档中追加或修改以下信息：

```md
### 模块名

测试文件：
- path/to/file.test.ts
- path/to/file.spec.ts

新增覆盖点：
- [x] 成功路径
- [x] 鉴权 / 权限校验
- [x] 参数校验 / 表单校验
- [x] 关键状态变化
- [x] 异常路径

验证命令：
- `pnpm ...`

结果：
- N passed
- 覆盖率变化：xx.xx% -> yy.yy%

剩余缺口：
- [ ] ...
```

## 11. 与其他测试文档的关系

| 文档 | 用途 |
| --- | --- |
| `docs/testing-maintenance.md` | 测试设计、结果快照、运行流程、长期维护规范 |
| `docs/TEST_list.md` | 细粒度测试清单，用于逐项勾选功能覆盖 |
| `docs/testing.md` | 早期测试策略说明，内容较简略，后续可逐步并入本文档 |
| `README.md` | 面向快速启动的测试命令摘要 |

后续维护时，本文档应作为测试体系的主文档；`TEST_list.md` 作为执行清单保持同步。
