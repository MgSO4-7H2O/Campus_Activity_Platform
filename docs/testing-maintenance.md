# 测试设计与维护说明

本文档用于长期维护项目测试体系。每次新增功能、修改业务流程或补充测试后，都应同步更新本文档和 `docs/TEST_list.md`，确保测试范围、测试结果、运行方式和已知问题保持可追踪。

最近验证日期：2026-06-01

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
| 覆盖率 | Vitest coverage v8 | `*/coverage` | 观察模块测试覆盖情况，定位后续补测重点 |

常规前端 E2E 仍以 mock API 或前端本地状态为主；真实联调 E2E 单独使用 `frontend/playwright.real.config.ts` 启动真实后端和前端服务。

## 3. 当前测试结果快照

| 项目 | 当前结果 | 命令 |
| --- | ---: | --- |
| 全仓单元/模块测试 | 65 passed | `pnpm -r test:run` |
| shared 测试 | 6 passed | `pnpm --filter @campus-activity/shared test:run` |
| backend 测试 | 39 passed | `pnpm --filter @campus-activity/server test:run` |
| frontend 组件/页面测试 | 20 passed | `pnpm --filter @campus-activity/web test:run` |
| frontend E2E | 3 passed | `pnpm --filter @campus-activity/web test:e2e` |
| 真实后端 + PostgreSQL E2E | 1 passed | `pnpm --filter @campus-activity/web test:e2e:real` |
| 全仓类型检查 | passed | `pnpm typecheck` |
| 全仓 lint | passed，49 warnings | `pnpm lint` |

最近覆盖率结果为上次生成结果；新增 recruitment、signup、checkin、closure、announcements、notifications、前端通知中心、前端签到等测试后，尚未重新生成 coverage：

| 包 | 语句覆盖率 | 分支覆盖率 | 说明 |
| --- | ---: | ---: | --- |
| backend | 70.67% | 69.94% | 上次覆盖率报告；本轮新增 recruitment、signup、checkin、closure、announcements、notifications 等接口测试后需重新生成 |
| frontend | 24.30% | 56.47% | 新增申请列表、审核待办、审核详情后有所提升；大量 mock 原型页面仍为 0 |
| shared | 54.76% | 0% | 已覆盖 roles、statuses、http 契约，尚未覆盖 shared 与 Prisma enum 一致性 |

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

真实联调 E2E 当前使用 `backend/.env` 指向的 PostgreSQL。运行前需保证数据库结构和基础 seed 已准备好。测试创建的 `real...` 用户会在测试结束后由 `backend/src/test/real-e2e-cleanup.ts` 清理。

后端 Vitest 测试使用 `backend/src/test/fixtures.ts` 中的 `cleanupTestData()` 在每个用例前清理测试 fixture 数据，保证用例之间的数据隔离。真实联调 E2E 使用唯一 `real...` 用户名、邮箱和手机号，并在每个用例结束后调用 `backend/src/test/real-e2e-cleanup.ts` 清理真实浏览器流程创建的用户及 profile。

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
| `shared/src/types/roles.test.ts` | `STUDENT`、`BASIC_USER` 等角色常量基础契约 |
| `shared/src/types/statuses.test.ts` | 活动申请 workflow 状态、报名状态常量 |
| `shared/src/types/http.test.ts` | 成功响应 metadata、失败响应 error 字段契约 |

### 6.2 backend

| 模块 | 测试文件 | 覆盖点 |
| --- | --- | --- |
| health | `backend/src/modules/health/health.routes.test.ts` | `GET /api/v1/health` 返回 200 和 `ok` |
| auth | `backend/src/modules/auth/auth.routes.test.ts` | 学生/教师注册、缺字段、短用户名、重复用户名、登录成功、密码错误、未登录访问 |
| users | `backend/src/modules/users/users.routes.test.ts` | 基础信息更新、非法 email、无效 token、学生 profile、教师 profile、grade 类型校验 |
| real E2E cleanup | `backend/src/test/real-e2e-cleanup.test.ts` | 删除真实 E2E 测试用户，并验证学生 profile 级联删除 |
| role-applications | `backend/src/modules/role-applications/role-applications.routes.test.ts` | 未登录拒绝、创建 ORGANIZER 申请、本人申请列表、student 申请 REVIEWER 拒绝、缺组织拒绝、审核通过写角色和组织绑定 |
| activity-applications | `backend/src/modules/activity-applications/activity-applications.routes.test.ts` | 未登录拒绝、创建草稿、非法组织、草稿更新、非申请人拒绝、提交后创建 reviewer 待办 |
| approval / pending-tasks | `backend/src/modules/approval/approval.routes.test.ts` | 待办鉴权、只返回当前用户待办、按 `status` 过滤、非法过滤参数拒绝 |
| announcements / notifications | `backend/src/modules/announcements/announcements.routes.test.ts` | SYS_ADMIN 创建公告草稿、发布公告、写入发布事件、BASIC_USER 收到未读通知、通知列表、单条已读、普通用户创建公告拒绝 |
| recruitment / signup | `backend/src/modules/recruitment/recruitment-signups.routes.test.ts` | 创建招募草稿、发布招募、活动进入 RECRUITING、学生报名、创建报名审核待办、负责人审核、待办完成、通知申请人 |
| checkin | `backend/src/modules/checkin/checkin.routes.test.ts` | 创建签到码场次、开启场次、统计已通过报名人数、签到码签到、重复签到冲突、查询签到记录 |
| closure | `backend/src/modules/closure/closure.routes.test.ts` | 创建结项草稿、提交后创建结项审核待办、审核通过、活动变为 CLOSED、查询审核记录、通知负责人 |

后端测试数据辅助：

- `backend/src/test/fixtures.ts`
- 提供核心角色初始化、用户/组织/活动等 fixture 创建与清理能力。

### 6.3 frontend 组件/页面

| 页面/组件 | 测试文件 | 覆盖点 |
| --- | --- | --- |
| LoginPage | `frontend/src/app/App.test.tsx` | 登录表单基础渲染 |
| RegisterPage | `frontend/src/modules/auth/RegisterPage.test.tsx` | 注册表单字段渲染 |
| MeEditPage | `frontend/src/modules/users/MeEditPage.test.tsx` | 基础信息编辑字段渲染 |
| MeProfilePage | `frontend/src/modules/users/MeProfilePage.test.tsx` | 学生/教师扩展资料字段差异 |
| RequireAuth | `frontend/src/shared/auth/guards.test.tsx` | 未登录跳转 `/login`、已登录渲染子内容 |
| AppLayout | `frontend/src/shared/components/AppLayout.test.tsx` | 多角色视图切换、角色菜单、退出登录清 session 并跳转 |
| MyApplicationsPage | `frontend/src/modules/activity-applications/MyApplicationsPage.test.tsx` | 申请列表渲染、按活动名称搜索、进行中筛选 |
| ReviewerInboxPage | `frontend/src/modules/approval/ReviewerInboxPage.test.tsx` | 待办列表渲染、按活动名称/组织搜索、进入审核详情 |
| ReviewerDetailPage | `frontend/src/modules/approval/ReviewerDetailPage.test.tsx` | 申请详情、附件、审核历史、空意见阻止确认、填写意见后打开确认弹窗、缺失申请空状态 |
| NotificationCenterPage | `frontend/src/modules/notifications/NotificationCenterPage.test.tsx` | 未读筛选、单条标记已读、全部标记已读 |
| CheckinPage | `frontend/src/modules/checkin/CheckinPage.test.tsx` | 已有签到场次、签到码展示、创建手动签到场次 |

前端测试环境：

- `frontend/src/__tests__/setup.ts`
- 已补 `matchMedia`、`ResizeObserver`、`getComputedStyle`，用于稳定 Ant Design 组件在 jsdom 下的测试。

### 6.4 frontend E2E

| 流程 | 测试文件 | 覆盖点 |
| --- | --- | --- |
| 用户注册-资料-退出闭环 | `frontend/tests/e2e/auth-user-flow.spec.ts` | mock 注册 API、跳转资料页、修改学生 profile、查看个人信息、退出登录、受保护路由回登录页 |
| 组织者立项申请前端流程 | `frontend/tests/e2e/organizer-reviewer-flow.spec.ts` | 注入 ORGANIZER 登录态、打开 `/applications`、进入 `/applications/new`、空表单提交触发表单校验 |
| 审核人处理立项待办前端流程 | `frontend/tests/e2e/organizer-reviewer-flow.spec.ts` | 注入 REVIEWER 登录态、打开 `/approvals`、进入审核详情、填写审核意见、打开确认弹窗、确认后返回 `/approvals` |
| 真实后端注册-资料-重登闭环 | `frontend/tests/e2e-real/auth-real-backend.spec.ts` | 自动启动真实 backend 和 frontend，连接 PostgreSQL，浏览器注册唯一测试用户，修改学生 profile，退出后重新登录，验证 profile 数据持久化，测试结束后清理用户并验证无法再次登录 |

## 7. 当前未覆盖或覆盖不足的区域

### 7.1 后端

| 模块 | 当前覆盖 | 仍缺少的测试重点 |
| --- | --- | --- |
| auth / users | 覆盖学生和教师注册、登录、缺字段、短用户名、重复用户名、密码错误、当前用户读取、基础资料更新、学生/教师 profile 更新和部分校验 | 账号禁用后的登录与访问拒绝、更新 email 或 phone 时的唯一性冲突、`/users/me/roles` 路由、profile 缺失或角色不匹配时的错误路径 |
| role-applications | 覆盖未登录拒绝、ORGANIZER 申请、本人列表、学生申请 REVIEWER 拒绝、缺组织拒绝、审核通过写入角色和组织绑定 | 审核拒绝、重复申请、非 SYS_ADMIN 审核拒绝、已审核申请重复审核、TEACHER 申请 REVIEWER 的成功路径、详情读取权限 |
| activity-applications / approval | 覆盖创建草稿、非法组织、草稿更新、非申请人更新拒绝、提交后创建 reviewer 待办、待办列表和 status 过滤；service 层覆盖最终通过生成活动 | 附件上传和删除、申请详情权限、审核拒绝、退回补材料、多级审核、路由级“最终通过生成活动”、审核记录读取、非法状态流转 |
| activities | 仅被招募、签到、结项流程间接使用活动数据 | 活动列表、我的活动、活动详情、开始活动、结束活动、负责人权限、状态约束和非法状态流转 |
| recruitment | 覆盖负责人创建招募草稿、发布招募、活动进入 RECRUITING、按 PUBLISHED 查询列表 | 招募编辑、关闭、非负责人拒绝、容量限制、报名时间窗口、用户类型限制、年级/专业限制、详情接口和非法状态发布 |
| signup | 覆盖学生报名、创建 SIGNUP_REVIEW 待办、负责人审核通过、待办完成、通知申请人 | 重复报名、取消报名、审核拒绝、非负责人审核拒绝、报名材料上传、容量满员、非学生报名限制、报名详情权限 |
| checkin | 覆盖创建 CODE 场次、开启场次、统计已通过报名人数、已通过用户用签到码签到、重复签到冲突、记录查询 | 错误签到码、未开放或已关闭场次签到、未通过报名用户拒绝、关闭场次、手动补签、QRCODE 场次、非负责人创建/查看/补签拒绝 |
| closure | 覆盖负责人创建结项草稿、提交后创建 CLOSURE_REVIEW 待办、审核通过、活动变为 CLOSED、记录查询、通知负责人 | 退回补材料、审核拒绝、多级审核、非负责人提交/查看拒绝、附件上传、草稿更新、重复结项、非法活动状态结项 |
| announcements / notifications | 覆盖 SYS_ADMIN 创建公告草稿、发布公告、发布事件、BASIC_USER 收到未读通知、通知列表、单条已读、普通用户创建公告拒绝 | 公告更新、归档、分类筛选、置顶排序、公告详情、全部已读、已读筛选、未读数量、读取其他用户通知拒绝、通知分页 |
| admin | 未覆盖 | 角色申请列表与审核聚合、用户列表、用户详情、用户状态管理、系统日志、dashboard、管理员权限拒绝路径 |
| organizations | 未覆盖 | 组织列表、组织树、组织详情、创建/更新组织、用户组织绑定/解绑、查询用户组织、管理员权限校验 |
| pending-tasks | 覆盖 `/pending-tasks/me` 的鉴权、当前用户过滤、status 过滤和非法过滤参数 | 待办详情、待办 process、无权查看或处理、不同 taskType 的处理入口一致性 |
| shared 与 Prisma enum 一致性 | shared 仅覆盖前端共享常量自身存在 | 防止 shared 状态常量、角色常量与 Prisma enum 漂移的契约测试 |
| 测试数据隔离 | 后端模块测试用例前清理 fixture；真实 E2E 创建唯一 `real...` 用户并在用例后清理 | 独立 `campus_test` 数据库、backend suite 结束后的最终清理检查、真实 E2E 扩展到活动/待办/报名/签到/结项后的多资源清理 |

### 7.2 前端

| 区域 | 当前覆盖 | 仍缺少的测试重点 |
| --- | --- | --- |
| LoginPage | 仅在 `App.test.tsx` 中覆盖登录表单基础渲染 | 登录成功、登录失败、错误提示、loading、登录后回跳来源、已登录访问登录页行为 |
| RegisterPage | 覆盖注册字段渲染 | 字段校验、提交成功、提交失败、重复用户名错误、不同身份默认 profile 流向 |
| MePage | 未覆盖 | 当前用户信息展示、角色展示、profile 为空、刷新失败、跳转编辑入口 |
| MeEditPage / MeProfilePage | 覆盖基础字段和学生/教师 profile 字段差异 | 保存成功、保存失败、API error、loading、服务端校验错误、保存后跳转或提示 |
| ActivityApplyPage / MyApplicationsPage | 我的申请覆盖列表渲染、搜索、进行中筛选 | 新建立项表单提交、草稿保存、附件、字段校验、API error、状态标签和空列表 |
| ReviewerInboxPage / ReviewerDetailPage | 覆盖 mock 待办列表、搜索、进入详情、详情展示、附件、审核历史、空意见阻止通过、确认弹窗和空状态 | 真实 API 数据路径、审核拒绝、退回补材料、loading、error、不同状态下按钮禁用 |
| ActivityListPage / ActivityDetailPage / MyActivitiesPage | 未覆盖 | 活动列表、筛选、详情、报名入口、我的活动、开始/结束按钮、不同活动状态展示和权限差异 |
| RecruitmentEditPage / ActivityRegisterPage / MyRegistrationsPage / RegistrationReviewPage | 未覆盖 | 招募创建/编辑/发布/关闭、报名表单、我的报名、报名审核、容量满员和限制条件提示 |
| CheckinPage | 覆盖 mock 已有场次、签到码展示、创建手动签到场次 | 真实 API 数据路径、打开/关闭场次、错误签到码、手动补签、签到记录空态和失败态 |
| ClosureApplyPage / ClosureInboxPage / ClosureReviewPage | 未覆盖 | 结项申请提交、附件、审核列表、审核详情、通过/拒绝/退回、表单校验和错误态 |
| NotificationCenterPage | 覆盖 mock 未读筛选、单条已读、全部已读 | 真实 API 数据路径、分页、未读数量同步、全部已读失败、空态、已读筛选 |
| Admin / Sysadmin / Organizations / Permissions / Tasks | 基本未覆盖 | 用户管理、用户详情、组织管理、系统日志、公告管理、权限申请、角色审核、待办中心 |

### 7.3 E2E

| 流程 | 当前覆盖 | 仍缺少的测试重点 |
| --- | --- | --- |
| mock 注册-资料-退出闭环 | 覆盖注册页、mock register API、profile 编辑、个人页、退出登录和受保护路由回登录页 | 登录失败、刷新持久化、真实 API 替换后的同链路 |
| mock 组织者立项流程 | 覆盖 ORGANIZER 登录态、申请列表、进入新建立项、空表单校验 | 完整提交、附件、草稿保存、提交后状态变化 |
| mock reviewer 审核流程 | 覆盖 REVIEWER 登录态、待办列表、进入详情、填写意见、确认通过后返回列表 | 驳回、退回补材料、错误态、真实 API 替换后的同链路 |
| 真实后端注册-profile-重登闭环 | 覆盖真实 backend、真实 PostgreSQL、唯一测试用户、浏览器注册、profile 保存、退出重登、持久化验证、测试用户清理 | 独立测试数据库、基础 seed 固化、失败路径、账号禁用、更多资源清理 |
| 权限申请真实 E2E | 未覆盖 | 用户申请角色、管理员审核、角色生效、无权访问拒绝 |
| 活动立项真实 E2E | 未覆盖 | 组织者创建并提交立项、reviewer 审核、最终生成活动、待办和通知联动 |
| 招募报名真实 E2E | 未覆盖 | 负责人发布招募、学生报名、负责人审核、学生查看报名状态 |
| 签到真实 E2E | 未覆盖 | 负责人创建/开启场次、学生签到、负责人查看记录、重复签到失败 |
| 结项真实 E2E | 未覆盖 | 负责人提交结项、reviewer 审核、活动关闭、通知负责人 |
| admin / organization 真实 E2E | 未覆盖 | 用户状态管理、组织创建更新、用户组织绑定、系统日志可见 |
| 负向权限 E2E | 未覆盖 | 未登录、低权限、跨用户数据访问、非法状态操作 |

真实后端联动 E2E 当前使用唯一用户名、邮箱和手机号避免冲突，并在 `afterEach` 中调用 backend 侧 Prisma 清理脚本删除测试用户。后续真实流程一旦创建活动、申请、待办、报名、签到和结项数据，需要同步扩展清理脚本，不能依赖手工清库。

### 7.4 覆盖率与质量门禁

| 区域 | 当前状态 | 后续测试重点 |
| --- | --- | --- |
| coverage 报告 | backend、frontend、shared 均已有历史报告；新增测试后未重新生成 | 重新运行 `pnpm --filter @campus-activity/server test:coverage`、`pnpm --filter @campus-activity/web test:coverage`、`pnpm --filter @campus-activity/shared test:coverage`，更新本文件中的覆盖率数字 |
| lint 门禁 | `pnpm lint` 通过但仍有 49 个 backend warning | 清理或建立 warning budget，避免 warning 长期被视为正常噪音 |
| CI 自动化 | 文档记录了本地命令，仓库内尚未形成完整 CI 门禁 | 接入 lint、typecheck、单元/模块测试、mock E2E；真实 PostgreSQL E2E 需配置独立数据库和 seed |
| 测试数据隔离 | 单元/模块测试和真实 E2E 有基础清理机制 | 真实全流程 E2E 前先完成独立测试库和可重复 seed，避免污染开发数据 |

## 8. 已知问题与风险

1. 全仓 lint 当前通过但仍有 49 个 backend warning，主要是 `@typescript-eslint/no-explicit-any`。
2. 前端 `AppLayout.test.tsx` 仍会输出 React `act(...)` warning。测试通过，但后续应收敛异步状态更新断言。
3. Ant Design v5 在 React 19 下会输出兼容 warning。测试通过，但需要关注 UI 组件库升级或兼容适配。
4. Playwright webServer 会输出 `NO_COLOR` 被 `FORCE_COLOR` 覆盖的 warning，不影响结果，但会污染日志。
5. 后端测试和真实联调 E2E 当前使用 `backend/.env` 指向的数据库，尚未隔离到独立 `campus_test`。
6. 真实联调 E2E 清理范围当前主要覆盖 `real...` 测试用户及 profile；若未来真实 E2E 创建活动、申请、待办、报名、签到或结项数据，需要同步扩展清理脚本。
7. 新增测试后尚未重新生成 coverage，当前覆盖率数字只能作为历史参考。
8. Codex 沙箱内 `tsx` 创建 IPC pipe 会触发 `listen EPERM`，真实 E2E 需要在非沙箱环境运行。

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
